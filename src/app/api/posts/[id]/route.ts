// src/app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

// GET: Lấy chi tiết bài đăng
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Kiểm tra xem db.post có tồn tại không
    const dbAny = db as unknown as Record<string, { findFirst: (args: unknown) => Promise<unknown> } | undefined>;
    const postModel = dbAny.post;

    if (!postModel) {
      return NextResponse.json(
        { error: "Post model chưa được generate. Vui lòng chạy: npx prisma generate" },
        { status: 503 }
      );
    }

    const post = await postModel.findFirst({
      where: { id, userId: session.user.id },
      include: {
        rule: {
          select: {
            id: true,
            ruleName: true,
            platform: true,
            scheduleTime: true,
            frequency: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy bài đăng" }, { status: 500 });
  }
}

// PUT: Cập nhật thông tin bài đăng (thống kê)
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    postUrl?: string;
    pageId?: string;
    pageName?: string;
    views?: number;
    interactions?: number;
    shares?: number;
    comments?: number;
  };

  try {
    // Kiểm tra xem db.post có tồn tại không
    const dbAny = db as unknown as Record<
      string,
      { findFirst: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown> } | undefined
    >;
    const postModel = dbAny.post;

    if (!postModel) {
      return NextResponse.json(
        { error: "Post model chưa được generate. Vui lòng chạy: npx prisma generate" },
        { status: 503 }
      );
    }

    const existingPost = await postModel.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    const updatedPost = await postModel.update({
      where: { id },
      data: {
        ...(body.postUrl !== undefined && { postUrl: body.postUrl }),
        ...(body.pageId !== undefined && { pageId: body.pageId }),
        ...(body.pageName !== undefined && { pageName: body.pageName }),
        ...(body.views !== undefined && { views: body.views }),
        ...(body.interactions !== undefined && { interactions: body.interactions }),
        ...(body.shares !== undefined && { shares: body.shares }),
        ...(body.comments !== undefined && { comments: body.comments }),
      },
      include: {
        rule: {
          select: {
            id: true,
            ruleName: true,
            platform: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật bài đăng" }, { status: 500 });
  }
}

// DELETE: Xóa bài đăng
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Kiểm tra xem db.post có tồn tại không
    const dbAny = db as unknown as Record<
      string,
      { findFirst: (args: unknown) => Promise<unknown>; delete: (args: unknown) => Promise<unknown> } | undefined
    >;
    const postModel = dbAny.post;

    if (!postModel) {
      return NextResponse.json(
        { error: "Post model chưa được generate. Vui lòng chạy: npx prisma generate" },
        { status: 503 }
      );
    }

    const post = await postModel.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Không tìm thấy bài đăng" }, { status: 404 });
    }

    await postModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Lỗi khi xóa bài đăng" }, { status: 500 });
  }
}

