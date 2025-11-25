// src/app/api/n8n/pending-rules/route.ts
// API endpoint để n8n lấy danh sách quy tắc cần chạy
import { NextResponse } from "next/server";
import { db } from "~/server/db";

// GET: Lấy danh sách quy tắc cần chạy (dựa trên nextRunAt)
export async function GET(request: Request) {
  // Xác thực bằng API key hoặc token
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.N8N_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Lấy các quy tắc cần chạy:
    // - Status = ACTIVE
    // - nextRunAt <= now (đã đến giờ chạy)
    // - Hoặc chưa có nextRunAt (chưa chạy lần nào)
    // - User phải có pageId và encryptedPageToken (đã kết nối Facebook Page)
    const pendingRules = await db.autoPostRule.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null },
        ],
        user: {
          pageId: { not: null },
          encryptedPageToken: { not: null },
        },
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
      orderBy: { nextRunAt: "asc" },
      take: 10, // Giới hạn số lượng để xử lý
    });

    // Format dữ liệu cho n8n
    const formattedRules = await Promise.all(
      pendingRules.map(async (rule) => {
        let selectedProduct = null;

        if (rule.products.length > 0) {
          // Nếu rule có products được chọn, chỉ lấy từ danh sách đó
          selectedProduct = rule.products.sort((a, b) => {
            const aTime = a.lastPostedAt?.getTime() ?? 0;
            const bTime = b.lastPostedAt?.getTime() ?? 0;
            return aTime - bTime;
          })[0];
        } else {
          // Nếu rule không có products được chọn, lấy từ tất cả sản phẩm của user
          const allProducts = await db.product.findMany({
            where: { userId: rule.user.id },
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

        return {
          ruleId: rule.id,
          ruleName: rule.ruleName,
          platform: rule.platform,
          scheduleTime: rule.scheduleTime,
          frequency: rule.frequency,
          promptTemplate: rule.promptTemplate,
          preview: rule.preview,
          // Thông tin sản phẩm
          product: selectedProduct
            ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                description: selectedProduct.description,
                imageUrls: selectedProduct.imageUrls,
              }
            : null,
          // Thông tin Facebook Page
          pageId: rule.user.pageId,
          pageName: rule.user.name,
          pageToken: rule.user.encryptedPageToken, // n8n sẽ dùng token này để đăng
          userId: rule.user.id,
        };
      })
    );

    return NextResponse.json({
      rules: formattedRules,
      count: formattedRules.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Get pending rules error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy danh sách quy tắc" }, { status: 500 });
  }
}

