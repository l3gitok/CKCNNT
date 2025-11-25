import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { PostListManager } from "~/components/posts/PostListManager";

export const metadata = {
  title: "Quản lý Bài đăng - Auto Marketing",
  description: "Xem và quản lý các bài đăng đã được tạo tự động",
};

export default async function PostsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
      </main>
    );
  }


  // Type definition cho Post
  type PostWithRule = {
    id: string;
    postUrl: string | null;
    pageId: string | null;
    pageName: string | null;
    views: number;
    interactions: number;
    shares: number;
    comments: number;
    createdAt: Date;
    rule: {
      id: string;
      ruleName: string;
      platform: string;
    };
  };

  let posts: PostWithRule[] = [];
  let rules: Array<{ id: string; ruleName: string; platform: string }> = [];
  let userPageId: string | null = null;
  let userPageName: string | null = null;

  try {
    // Lấy user info
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        pageId: true,
        name: true,
      },
    }).catch(() => null);

    if (user) {
      userPageId = user.pageId;
      userPageName = user.name;
    }

    // Kiểm tra xem db.post có tồn tại không (sau khi chạy prisma generate)
    const dbAny = db as unknown as Record<string, { findMany: (args: unknown) => Promise<PostWithRule[]> } | undefined>;
    const postModel = dbAny.post;

    if (postModel) {
      [posts, rules] = await Promise.all([
        postModel.findMany({
          where: { userId: session.user.id },
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
        }).catch(() => []),
        db.autoPostRule.findMany({
          where: { userId: session.user.id },
          select: {
            id: true,
            ruleName: true,
            platform: true,
          },
          orderBy: { ruleName: "asc" },
        }).catch(() => []),
      ]);
    } else {
      // Nếu model chưa tồn tại, chỉ lấy rules
      rules = await db.autoPostRule.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          ruleName: true,
          platform: true,
        },
        orderBy: { ruleName: "asc" },
      }).catch(() => []);
    }
  } catch (error) {
    console.error("Error loading posts:", error);
    // Fallback: trả về empty arrays
    posts = [];
    rules = [];
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quản lý Bài đăng</h1>
        <p className="mt-1 text-sm text-gray-500">Xem và quản lý các bài đăng đã được đăng lên Facebook Page</p>
      </div>

      <PostListManager initialPosts={posts} rules={rules} userPageId={userPageId} userPageName={userPageName} />
    </div>
  );
}

