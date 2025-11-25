// src/app/api/rules/[id]/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "~/../generated/prisma";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

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

// PUT: Cập nhật thông tin quy tắc
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as UpdateRuleBody;
  const { ruleName, platform, scheduleTime, frequency, promptTemplate, status, productIds, preview } = body;

  try {
    const existingRule = await db.autoPostRule.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    const data: Prisma.AutoPostRuleUpdateInput = {};

    if (ruleName !== undefined) data.ruleName = ruleName;
    if (platform !== undefined) data.platform = platform;
    if (scheduleTime !== undefined) data.scheduleTime = scheduleTime;
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
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Update rule error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật" }, { status: 500 });
  }
}

// DELETE: Xóa quy tắc
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rule = await db.autoPostRule.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { id: true },
    });

    if (!rule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    await db.autoPostRule.delete({
      where: { id: rule.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete rule error:", error);
    return NextResponse.json({ error: "Lỗi xóa" }, { status: 500 });
  }
}