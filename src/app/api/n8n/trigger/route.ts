// src/app/api/n8n/trigger/route.ts
// API endpoint để trigger n8n webhook với rule cụ thể
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

// POST: Trigger n8n webhook với rule cụ thể
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    return NextResponse.json({ error: "N8N webhook URL chưa được cấu hình" }, { status: 500 });
  }

  const body = (await request.json()) as {
    ruleId: string;
    editedPreviewText?: string; // Text đã được user chỉnh sửa
  };

  const { ruleId, editedPreviewText } = body;

  if (!ruleId) {
    return NextResponse.json({ error: "Thiếu ruleId" }, { status: 400 });
  }

  try {
    // Lấy thông tin rule và các dữ liệu liên quan
    const rule = await db.autoPostRule.findFirst({
      where: {
        id: ruleId,
        userId: session.user.id,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrls: true,
            lastPostedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            pageId: true,
            name: true,
            encryptedPageToken: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    // Kiểm tra rule có ACTIVE không
    if (rule.status !== "ACTIVE") {
      return NextResponse.json({ error: "Quy tắc chưa được kích hoạt" }, { status: 400 });
    }

    // Kiểm tra user có pageId và token không
    if (!rule.user.pageId || !rule.user.encryptedPageToken) {
      return NextResponse.json({ error: "Chưa kết nối Facebook Page" }, { status: 400 });
    }

    // Chọn sản phẩm để đăng
    let selectedProduct = null;
    if (rule.products.length > 0) {
      // Nếu rule có products được chọn, ưu tiên sản phẩm chưa đăng lâu nhất
      selectedProduct = rule.products.sort((a, b) => {
        const aTime = a.lastPostedAt?.getTime() ?? 0;
        const bTime = b.lastPostedAt?.getTime() ?? 0;
        return aTime - bTime;
      })[0];
    } else {
      // Nếu rule không có products được chọn, lấy từ tất cả sản phẩm của user
      const allProducts = await db.product.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrls: true,
          lastPostedAt: true,
        },
        orderBy: { lastPostedAt: "asc" },
        take: 1,
      });
      selectedProduct = allProducts[0] ?? null;
    }

    if (!selectedProduct) {
      return NextResponse.json({ error: "Không có sản phẩm để đăng" }, { status: 400 });
    }

    // Lấy preview data từ rule
    const preview = rule.preview as { text?: string; imageUrl?: string; productName?: string } | null;
    
    // Sử dụng editedPreviewText nếu có, nếu không thì dùng từ preview
    const previewText = editedPreviewText ?? preview?.text ?? "";
    
    // Lấy imageUrl từ preview, nếu không có thì fallback về product.imageUrls[0]
    const previewImageUrl = preview?.imageUrl ?? selectedProduct.imageUrls?.[0] ?? "";
    
    // Format dữ liệu đơn giản để gửi đến n8n (theo workflow mới)
    // Workflow n8n sẽ tự query database để lấy token và pageId
    const payload = {
      userId: rule.user.id, // n8n sẽ dùng userId để query token từ DB
      ruleId: rule.id, // n8n sẽ dùng ruleId để update lastRunAt
      previewData: {
        text: previewText, // Text đã được chỉnh sửa hoặc từ preview
        imageUrl: previewImageUrl, // Image URL từ preview
        productName: preview?.productName ?? selectedProduct.name,
      },
    };

    // Gọi n8n webhook
    console.log("Calling n8n webhook:", n8nWebhookUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    console.log("n8n response status:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `N8N webhook failed: ${response.statusText}`;
      
      try {
        const errorData = (await response.json()) as { code?: number; message?: string; hint?: string; status?: string; error?: string };
        errorMessage = errorData.message ?? errorData.error ?? errorMessage;
        
        // Xử lý lỗi đặc biệt cho test mode
        if (errorData.code === 404 && errorData.message?.includes("not registered")) {
          errorMessage = "Webhook chưa được kích hoạt. Vui lòng:\n1. Mở workflow trong n8n\n2. Click nút 'Execute workflow' trên canvas\n3. Hoặc activate workflow để sử dụng production webhook";
        }
        
        if (errorData.hint) {
          errorMessage += `\n\nGợi ý: ${errorData.hint}`;
        }
      } catch {
        // Nếu không parse được JSON, dùng text
        const errorText = await response.text();
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Workflow mới trả về JSON với status và post_id
    let data = {};
    const responseText = await response.text(); // Đọc text trước

    if (responseText) {
        try {
            data = JSON.parse(responseText) as { status?: string; post_id?: string };
        } catch (e) {
            console.warn("n8n response is not JSON:", responseText);
            data = { message: responseText }; // Nếu không phải JSON, coi như message text
        }
    } else {
        console.warn("n8n returned empty response");
    }

    return NextResponse.json({
      success: true,
      message: "Đã trigger n8n webhook thành công",
      data,
    });
  } catch (error) {
    console.error("Trigger n8n error:", error);
    
    // Log chi tiết để debug
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    // Kiểm tra nếu là lỗi database
    if (error && typeof error === "object" && "code" in error) {
      console.error("Database error code:", (error as { code?: string }).code);
    }
    
    return NextResponse.json(
      {
        error: "Lỗi khi trigger n8n webhook",
        details: error instanceof Error ? error.message : "Unknown error",
        // Thêm thông tin debug trong development
        ...(process.env.NODE_ENV === "development" && {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          n8nWebhookUrl: n8nWebhookUrl ? "Đã cấu hình" : "Chưa cấu hình",
        }),
      },
      { status: 500 }
    );
  }
}
