import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { env } from "~/env";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // GET /api/posts
  if (!slug || slug.length === 0) {
    return handleGetPosts(request);
  }

  // GET /api/posts/sync
  if (slug[0] === "sync") {
    return handleSyncPosts(request);
  }

  // GET /api/posts/[id]
  if (slug.length === 1) {
    return handleGetPostById(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // POST /api/posts
  if (!slug || slug.length === 0) {
    return handleCreatePost(request);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // PUT /api/posts/[id]
  if (slug && slug.length === 1) {
    return handleUpdatePost(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;

  // DELETE /api/posts/[id]
  if (slug && slug.length === 1) {
    return handleDeletePost(request, slug[0]!);
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// --- Handlers ---

async function handleGetPosts(request: Request) {
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

async function handleCreatePost(request: Request) {
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
        postUrl: postUrl ?? "",
        pageId: pageId ?? user?.pageId ?? "",
        pageName: pageName ?? user?.name ?? "",
        views,
        interactions,
        shares,
        comments,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo bài đăng" }, { status: 500 });
  }
}

async function handleSyncPosts(request: Request) {
  const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 phút
  const MAX_POSTS_PER_RUN = 20;
  const GRAPH_VERSION = process.env.FB_GRAPH_VERSION;

  interface GraphResponse {
    id: string;
    from?: { name: string };
    shares?: { count: number };
    comments?: { summary: { total_count: number } };
    reactions?: { summary: { total_count: number } };
    insights?: {
      data: Array<{
        name: string;
        values: Array<{ value: number }>;
      }>;
    };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoffTime = new Date(Date.now() - SYNC_INTERVAL_MS);

    const postsToSync = await db.post.findMany({
      where: {
        user: {
          encryptedPageToken: { not: null },
        },
        OR: [
          { lastSyncedAt: null },
          { lastSyncedAt: { lt: cutoffTime } }
        ],
      },
      include: {
        user: {
          select: { encryptedPageToken: true },
        },
      },
      orderBy: { lastSyncedAt: "asc" },
      take: MAX_POSTS_PER_RUN,
    });

    if (postsToSync.length === 0) {
      return NextResponse.json({ message: "Tất cả dữ liệu đã được cập nhật mới nhất." });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const results = await Promise.allSettled(
      postsToSync.map(async (post) => {
        const accessToken = post.user.encryptedPageToken;
        if (!accessToken) return;

        const fbPostId = post.id; 

        const params = new URLSearchParams({
          fields: "from,shares,comments.summary(true),reactions.summary(true),insights.metric(post_impressions_unique)",
          access_token: accessToken,
        });

        const response = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${fbPostId}?${params}`
        );

        if (!response.ok) {
          console.error(`Lỗi sync post ${post.id}:`, await response.text());
          return;
        }

        const data = (await response.json()) as GraphResponse;

        const newViews = data.insights?.data?.[0]?.values?.[0]?.value ?? post.views;
        const newInteractions = data.reactions?.summary?.total_count ?? post.interactions;
        const newShares = data.shares?.count ?? post.shares;
        const newComments = data.comments?.summary?.total_count ?? post.comments;
        const newPageName = data.from?.name ?? post.pageName;
        
        await db.post.update({
          where: { id: post.id },
          data: {
            views: newViews,
            interactions: newInteractions,
            shares: newShares,
            comments: newComments,
            pageName: newPageName,
            lastSyncedAt: new Date(),
          },
        });
      })
    );

    return NextResponse.json({
      message: `Đã đồng bộ ${postsToSync.length} bài viết.`,
      syncedCount: postsToSync.length,
    });
  } catch (error) {
    console.error("Sync posts error:", error);
    return NextResponse.json({ error: "Lỗi khi đồng bộ bài đăng" }, { status: 500 });
  }
}

async function handleGetPostById(request: Request, id: string) {
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

async function handleUpdatePost(request: Request, id: string) {
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

async function handleDeletePost(request: Request, id: string) {
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
