// src/app/api/rules/preview/route.ts
import { NextResponse } from "next/server";
import type { Prisma } from "~/../generated/prisma";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import OpenAI from "openai";

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // 5. Lưu preview vào database ngay nếu có ruleId (đang edit mode)
    if (body.ruleId) {
      try {
        // Kiểm tra rule có thuộc về user này không
        const existingRule = await db.autoPostRule.findFirst({
          where: {
            id: body.ruleId,
            userId: session.user.id,
          },
        });

        if (existingRule) {
          // Lưu preview vào database
          await db.autoPostRule.update({
            where: { id: body.ruleId },
            data: {
              preview: previewData as Prisma.InputJsonValue,
            },
          });
        }
      } catch (error) {
        // Log lỗi nhưng không fail request, vì preview đã được generate thành công
        console.error("Lỗi khi lưu preview vào database:", error);
      }
    }

    // 6. Trả về kết quả Preview
    // Lưu ý: Ở đây ta dùng ảnh sản phẩm làm ảnh preview (giống logic n8n).
    // Nếu bạn muốn DALL-E sinh ảnh mới hoàn toàn, cần gọi thêm API images.generate
    return NextResponse.json(previewData);

  } catch (error) {
    console.error("Preview Error:", error);
    return NextResponse.json({ error: "Lỗi khi gọi AI" }, { status: 500 });
  }
}