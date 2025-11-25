// src/app/api/rules/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "~/../generated/prisma";
import { auth } from "~/server/auth"; // Import hàm auth
import { db } from "~/server/db";
import type { RulePreview } from "~/lib/rules/types";

// Type cho request body
interface CreateRuleBody {
  ruleName: string;
  platform: string;
  scheduleTime: string;
  frequency: string;
  promptTemplate: string;
  productIds?: string[];
  preview?: RulePreview | null;
}

export async function POST(request: Request) {
  const session = await auth();

  // 1. Bảo mật: Kiểm tra xem người dùng đã đăng nhập chưa
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy dữ liệu từ client gửi lên
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
  
  // Tính toán ngày chạy tiếp theo
  const nextRun = new Date();
  nextRun.setDate(now.getDate() + 1); // Đặt là ngày mai
  nextRun.setHours(hours, minutes, 0, 0); // Đặt giờ và phút

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
