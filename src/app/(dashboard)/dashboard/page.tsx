import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { DashboardStats } from "~/components/dashboard/DashboardStats";
import { DashboardCharts } from "~/components/dashboard/DashboardCharts";

export const metadata = {
  title: "Tổng quan - Auto Marketing",
  description: "Tổng quan về hoạt động marketing của bạn",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
      </main>
    );
  }

  // Lấy thống kê với error handling
  let productsCount = 0;
  let rulesCount = 0;
  let postsDataResult: Array<{ postUrl: string | null; views: number; interactions: number; shares: number; comments: number }> = [];

  try {
    [productsCount, rulesCount, postsDataResult] = await Promise.all([
      db.product.count({
        where: { userId: session.user.id },
      }).catch(() => 0),
      db.autoPostRule.count({
        where: { userId: session.user.id },
      }).catch(() => 0),
      // Lấy posts (nếu model tồn tại)
      (async () => {
        try {
          const dbAny = db as unknown as Record<string, { findMany: (args: unknown) => Promise<Array<{ postUrl: string | null; views: number; interactions: number; shares: number; comments: number }>> } | undefined>;
          const postModel = dbAny.post;
          if (postModel) {
            return await postModel.findMany({
              where: { userId: session.user.id },
              select: {
                postUrl: true,
                views: true,
                interactions: true,
                shares: true,
                comments: true,
              },
            });
          }
          return [];
        } catch (error) {
          console.error("Error fetching posts:", error);
          return [];
        }
      })(),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
    // Sử dụng giá trị mặc định nếu không kết nối được database
  }

  // Đảm bảo postsData luôn là array
  const postsData = Array.isArray(postsDataResult) ? postsDataResult : [];

  // Đếm số bài đăng (theo URL)
  const postsCount = postsData.filter((post) => post.postUrl !== null).length;

  // Tính tổng thống kê
  const totalStats = postsData.reduce(
    (acc, post) => ({
      views: acc.views + post.views,
      interactions: acc.interactions + post.interactions,
      shares: acc.shares + post.shares,
      comments: acc.comments + post.comments,
    }),
    { views: 0, interactions: 0, shares: 0, comments: 0 }
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {session.user.name ?? "Người dùng"}!</h1>
        <p className="mt-1 text-gray-600">Chào mừng bạn quay trở lại bảng điều khiển.</p>
      </div>

      <DashboardStats productsCount={productsCount} rulesCount={rulesCount} postsCount={postsCount} />

      <DashboardCharts totalStats={totalStats} postsData={postsData} />
    </div>
  );
}
