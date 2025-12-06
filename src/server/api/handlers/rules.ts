import { NextResponse } from "next/server";
import { Prisma } from "~/../generated/prisma";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import OpenAI from "openai";
import type { RulePreview } from "~/lib/rules/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // POST /api/rules
  if (!slug || slug.length === 0) {
    return handleCreateRule(request);
  }

  // POST /api/rules/preview
  if (slug[0] === "preview") {
    return handlePreviewRule(request);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // PUT /api/rules/[id]
  if (slug?.length === 1) {
    return handleUpdateRule(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // DELETE /api/rules/[id]
  if (slug?.length === 1) {
    return handleDeleteRule(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// --- Handlers ---

async function handleCreateRule(request: Request) {
  const session = await auth();

  // 1. Bảo mật: Kiểm tra xem người dùng đã đăng nhập chưa
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy dữ liệu từ client gửi lên
  interface CreateRuleBody {
    ruleName: string;
    platform: string;
    scheduleTime: string;
    frequency: string;
    promptTemplate: string;
    productIds?: string[];
    preview?: RulePreview | null;
  }
  const body = (await request.json()) as CreateRuleBody;
  const { ruleName, platform, scheduleTime, frequency, promptTemplate, productIds, preview } = body;

  // 3. Validate (Kiểm tra dữ liệu đầu vào)
  if (!ruleName || !platform || !scheduleTime || !frequency || !promptTemplate) {
    return NextResponse.json({ error: "Thiếu trường thông tin" }, { status: 400 });
  }

  // 4. Tính toán nextRunAt (Quan trọng cho n8n)
  // Logic đơn giản: đặt lịch chạy vào 'scheduleTime' của ngày mai
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);

  // Validate time format
  if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
    return NextResponse.json({ error: "Định dạng thời gian không hợp lệ" }, { status: 400 });
  }
  
  // Tính toán ngày chạy tiếp theo (UTC)
  const nextRun = new Date();
  nextRun.setUTCDate(now.getUTCDate() + 1); // Đặt là ngày mai theo UTC
  nextRun.setUTCHours(hours - 7, minutes, 0, 0); // Đặt giờ và phút theo UTC (VN - 7)

  // 5. Lưu vào Database (Supabase)
  try {
    const rule = await db.autoPostRule.create({
      data: {
        ruleName,
        platform,
        scheduleTime, // "09:00"
        frequency,    // "DAILY"
        promptTemplate,
        status: "ACTIVE",
        nextRunAt: nextRun, // Đặt lịch chạy lần đầu
        userId: session.user.id, // Liên kết với người dùng
        preview: preview === null ? Prisma.JsonNull : (preview as Prisma.InputJsonValue | undefined),
        products: productIds && productIds.length > 0 ? {
          connect: productIds.map((id) => ({ id })),
        } : undefined,
      },
    });
    // 6. Trả về thành công
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Lỗi khi tạo quy tắc:", error);
    return NextResponse.json({ error: "Lỗi khi tạo quy tắc" }, { status: 500 });
  }
}

async function handlePreviewRule(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  interface PreviewBody {
    promptTemplate: string;
    ruleName?: string;
    platform?: string;
    scheduleTime?: string;
    frequency?: string;
    status?: string;
    productIds?: string[];
    ruleId?: string; // Thêm ruleId để lưu preview vào database nếu đang edit
  }

  const body = (await request.json()) as PreviewBody;
  const { promptTemplate, ruleName, platform, scheduleTime, frequency, status, productIds } = body;

  if (!promptTemplate) return NextResponse.json({ error: "Thiếu prompt template" }, { status: 400 });

  try {
    const whereClause: Prisma.ProductWhereInput = {
      userId: session.user.id,
      ...(productIds && productIds.length > 0
        ? {
            id: { in: productIds },
          }
        : {}),
    };

    let product = await db.product.findFirst({
      where: whereClause,
      orderBy: { lastPostedAt: "asc" },
    });

    if (!product && productIds?.length) {
      product = await db.product.findFirst({
        where: { userId: session.user.id },
        orderBy: { lastPostedAt: "asc" },
      });
    }

    if (!product) {
      return NextResponse.json({ error: "Bạn cần có ít nhất 1 sản phẩm để test." }, { status: 404 });
    }

    const placeholderMap: Record<string, string> = {
      PRODUCT_NAME: product.name,
      PRODUCT_DESC: product.description ?? "",
      RULE_NAME: ruleName ?? "",
      PLATFORM: platform ?? "",
      SCHEDULE_TIME: scheduleTime ?? "",
      FREQUENCY: frequency ?? "",
      STATUS: status ?? "",
    };

    let templatedPrompt = promptTemplate;
    Object.entries(placeholderMap).forEach(([token, value]) => {
      const regex = new RegExp(`\\[${token}\\]`, "g");
      templatedPrompt = templatedPrompt.replace(regex, value);
    });

    const contextBlock = [
      "Thông tin chiến dịch:",
      `- Tên quy tắc: ${placeholderMap.RULE_NAME ?? "Chưa đặt"}`,
      `- Nền tảng: ${placeholderMap.PLATFORM ?? "Chưa chọn"}`,
      `- Lịch đăng: ${placeholderMap.SCHEDULE_TIME ?? "Chưa thiết lập"} (${placeholderMap.FREQUENCY ?? "Không rõ"})`,
      `- Trạng thái mong muốn: ${placeholderMap.STATUS ?? "ACTIVE"}`,
      "",
      "Thông tin sản phẩm chính:",
      `- Tên sản phẩm: ${product.name}`,
      `- Mô tả: ${product.description ?? "Chưa có mô tả"}`,
    ].join("\n");

    const finalPrompt = `${contextBlock}\n\nYêu cầu nội dung:\n${templatedPrompt}`;

    // 3. Gọi OpenAI để sinh Text
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: finalPrompt }],
      model: "gpt-3.5-turbo",
    });

    const generatedText = completion.choices[0]?.message?.content ?? "Lỗi sinh nội dung";

    // 4. Tạo preview object
    const previewData = {
      text: generatedText,
      imageUrl: product.imageUrls?.[0] ?? "",
      productName: product.name,
    };

    return NextResponse.json(previewData);
  } catch (error) {
    console.error("Preview rule error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo preview" }, { status: 500 });
  }
}

async function handleUpdateRule(request: Request, id: string) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  interface UpdateRuleBody {
    ruleName?: string;
    platform?: string;
    scheduleTime?: string;
    frequency?: string;
    promptTemplate?: string;
    status?: string;
    productIds?: string[];
    preview?: unknown;
  }

  const body = (await request.json()) as UpdateRuleBody;
  const { ruleName, platform, scheduleTime, frequency, promptTemplate, status, productIds, preview } = body;

  try {
    const existingRule = await db.autoPostRule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    const data: Prisma.AutoPostRuleUpdateInput = {};

    if (ruleName !== undefined) data.ruleName = ruleName;
    if (platform !== undefined) data.platform = platform;
    if (scheduleTime !== undefined) {
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
        return NextResponse.json({ error: "Định dạng thời gian không hợp lệ" }, { status: 400 });
      }
      data.scheduleTime = scheduleTime;

      // Recalculate nextRunAt in UTC
      const now = new Date();
      const nextRun = new Date();
      nextRun.setUTCDate(now.getUTCDate() + 1);
      nextRun.setUTCHours(hours - 7, minutes, 0, 0); // VN time -> UTC
      data.nextRunAt = nextRun;
    }
    if (frequency !== undefined) data.frequency = frequency;
    if (promptTemplate !== undefined) data.promptTemplate = promptTemplate;
    if (status !== undefined) data.status = status;
    if (productIds !== undefined) {
      if (!Array.isArray(productIds)) {
        return NextResponse.json({ error: "productIds phải là một mảng" }, { status: 400 });
      }
      data.products = {
        set: productIds.map((productId: string) => ({ id: productId })),
      };
    }
    if (preview !== undefined) {
      data.preview = preview === null ? Prisma.JsonNull : (preview as Prisma.InputJsonValue);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật" }, { status: 400 });
    }

    const updatedRule = await db.autoPostRule.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Update rule error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

async function handleDeleteRule(request: Request, id: string) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existingRule = await db.autoPostRule.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    await db.autoPostRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rule error:", error);
    return NextResponse.json({ error: "Lỗi xóa quy tắc" }, { status: 500 });
  }
}
