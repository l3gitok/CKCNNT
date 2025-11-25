// src/app/api/posts/route.ts
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

// GET: Lấy danh sách bài đăng của user (đã đăng lên Facebook Page)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ruleId = searchParams.get("ruleId");

  try {
    const whereClause = {
      userId: session.user.id,
      ...(ruleId ? { ruleId } : {}),
    };

    // Kiểm tra xem db.post có tồn tại không
    const dbAny = db as unknown as Record<string, { findMany: (args: unknown) => Promise<unknown[]> } | undefined>;
    const postModel = dbAny.post;

    if (!postModel) {
      return NextResponse.json({ posts: [], message: "Post model chưa được generate. Vui lòng chạy: npx prisma generate" });
    }

    const posts = await postModel.findMany({
      where: whereClause,
      include: {
        rule: {
          select: {
            id: true,
            ruleName: true,
            platform: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Lỗi khi lấy danh sách bài đăng" }, { status: 500 });
  }
}

// POST: Tạo bài đăng mới (đã đăng lên Facebook Page)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    ruleId: string;
    postUrl?: string;
    pageId?: string;
    pageName?: string;
    views?: number;
    interactions?: number;
    shares?: number;
    comments?: number;
  };

  const { ruleId, postUrl, pageId, pageName, views = 0, interactions = 0, shares = 0, comments = 0 } = body;

  if (!ruleId) {
    return NextResponse.json({ error: "Thiếu ruleId" }, { status: 400 });
  }

  try {
    // Kiểm tra rule thuộc về user
    const rule = await db.autoPostRule.findFirst({
      where: { id: ruleId, userId: session.user.id },
    });

    if (!rule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    // Lấy thông tin Page từ user nếu chưa có
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pageId: true, name: true },
    });

    // Kiểm tra xem db.post có tồn tại không
    const dbAny = db as unknown as Record<string, { create: (args: unknown) => Promise<unknown> } | undefined>;
    const postModel = dbAny.post;

    if (!postModel) {
      return NextResponse.json(
        { error: "Post model chưa được generate. Vui lòng chạy: npx prisma generate" },
        { status: 503 }
      );
    }

    const post = await postModel.create({
      data: {
        ruleId,
        userId: session.user.id,
        postUrl: postUrl ?? null,
        pageId: pageId ?? user?.pageId ?? null,
        pageName: pageName ?? user?.name ?? null,
        views,
        interactions,
        shares,
        comments,
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

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo bài đăng" }, { status: 500 });
  }
}

