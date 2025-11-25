import { NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";

// Cấu hình
export const dynamic = 'force-dynamic'; // Đảm bảo route không bị cache static
const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 phút
const MAX_POSTS_PER_RUN = 20;
const GRAPH_VERSION = process.env.FB_GRAPH_VERSION;

// Interface cho dữ liệu trả về từ Facebook
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

// ĐỔI TỪ POST THÀNH GET ĐỂ PHÙ HỢP VERCEL CRON
export async function GET(request: Request) {
  // 1. Bảo mật Cron Job
  // Vercel sẽ tự động gửi header Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Tìm các bài viết cần cập nhật
    const cutoffTime = new Date(Date.now() - SYNC_INTERVAL_MS);

    const postsToSync = await db.post.findMany({
      where: {
        user: {
          encryptedPageToken: { not: null }, // Chỉ lấy user đã kết nối Fanpage
        },
        OR: [
          { lastSyncedAt: null },            // Chưa từng đồng bộ
          { lastSyncedAt: { lt: cutoffTime } } // Hoặc đã đồng bộ quá 10 phút
        ],
      },
      include: {
        user: {
          select: { encryptedPageToken: true },
        },
      },
      orderBy: { lastSyncedAt: "asc" }, // Ưu tiên bài lâu chưa update nhất
      take: MAX_POSTS_PER_RUN,
    });

    if (postsToSync.length === 0) {
      return NextResponse.json({ message: "Tất cả dữ liệu đã được cập nhật mới nhất." });
    }

    // 3. Chạy vòng lặp xử lý từng bài viết
    const results = await Promise.allSettled(
      postsToSync.map(async (post) => {
        const accessToken = post.user.encryptedPageToken;
        if (!accessToken) return; // Bỏ qua nếu không có token

        // Giả sử post.id chính là Facebook Post ID
        const fbPostId = post.id; 

        // Gọi Graph API
        const params = new URLSearchParams({
          fields: "from,shares,comments.summary(true),reactions.summary(true),insights.metric(post_impressions_unique)",
          access_token: accessToken,
        });

        const response = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${fbPostId}?${params}`
        );

        if (!response.ok) {
          // Nếu bài viết bị xóa trên FB hoặc lỗi Token -> Log lại và bỏ qua
          console.error(`Lỗi sync post ${post.id}:`, await response.text());
          return;
        }

        const data = (await response.json()) as GraphResponse;

        // Parse dữ liệu an toàn (Null Coalescing)
        const newViews = data.insights?.data?.[0]?.values?.[0]?.value ?? post.views;
        const newInteractions = data.reactions?.summary?.total_count ?? post.interactions;
        const newShares = data.shares?.count ?? post.shares;
        const newComments = data.comments?.summary?.total_count ?? post.comments;
        const newPageName = data.from?.name ?? post.pageName;
        
        // Update lên DB
        await db.post.update({
          where: { id: post.id },
          data: {
            views: newViews,
            interactions: newInteractions,
            shares: newShares,
            comments: newComments,
            pageName: newPageName,
            lastSyncedAt: new Date(), // Đánh dấu thời gian cập nhật
          },
        });
      })
    );

    // 4. Thống kê kết quả
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      synced: successCount,
      failed: failCount,
    });

  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}