// src/app/api/n8n/report-result/route.ts
// API endpoint để n8n báo cáo kết quả sau khi đăng bài
import { NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";

const GRAPH_VERSION = env.FB_GRAPH_VERSION ?? "v19.0";

async function fetchPageName(pageId: string, accessToken: string) {
  try {
    const params = new URLSearchParams({
      fields: "name",
      access_token: accessToken,
    });
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      console.warn("Failed to fetch page name:", response.statusText, text);
      return null;
    }

    const data = (await response.json()) as { name?: string };
    return data.name ?? null;
  } catch (error) {
    console.warn("Error fetching page name:", error);
    return null;
  }
}

// POST: n8n báo cáo kết quả đăng bài
export async function POST(request: Request) {
  // Xác thực bằng API key
  const authHeader = request.headers.get("authorization");
  const apiKey = process.env.N8N_API_KEY;

  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    ruleId: string;
    success: boolean;
    postUrl?: string;
    postId?: string;
    pageId?: string;
    pageName?: string;
    views?: number;
    interactions?: number;
    shares?: number;
    comments?: number;
    error?: string;
    productId?: string;
  };

  const { ruleId, success, postUrl, postId, pageId, pageName, views = 0, interactions = 0, shares = 0, comments = 0, error, productId } = body;

  if (!ruleId) {
    return NextResponse.json({ error: "Thiếu ruleId" }, { status: 400 });
  }

  try {
    // Lấy thông tin rule
    const rule = await db.autoPostRule.findUnique({
      where: { id: ruleId },
      include: {
        user: {
          select: {
            id: true,
            pageId: true,
            name: true,
            encryptedPageToken: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: "Không tìm thấy quy tắc" }, { status: 404 });
    }

    if (success) {
      // Tạo record Post trong database
      const dbAny = db as unknown as Record<string, { create: (args: unknown) => Promise<unknown> } | undefined>;
      const postModel = dbAny.post;

      let resolvedPageId = pageId ?? rule.user.pageId ?? null;
      let resolvedPageName = pageName ?? rule.user.name ?? null;

      if (resolvedPageId && rule.user.encryptedPageToken) {
        const graphName = await fetchPageName(resolvedPageId, rule.user.encryptedPageToken);
        if (graphName) {
          resolvedPageName = graphName;
        }
      }

      const resolvedPostUrl = postUrl ?? (postId ? `https://facebook.com/${postId}` : null);

      if (postModel) {
        await postModel.create({
          data: {
            ...(postId ? { id: postId } : {}),
            ruleId,
            userId: rule.user.id,
            postUrl: resolvedPostUrl,
            pageId: resolvedPageId,
            pageName: resolvedPageName,
            views,
            interactions,
            shares,
            comments,
            lastSyncedAt: new Date(),
          },
        });
      } else {
        console.warn("Post model chưa được generate. Vui lòng chạy: npx prisma generate");
      }

      // Cập nhật lastPostedAt cho sản phẩm nếu có
      if (productId) {
        await db.product.update({
          where: { id: productId },
          data: { lastPostedAt: new Date() },
        });
      }

      // Tính toán nextRunAt cho lần chạy tiếp theo
      const nextRun = calculateNextRun(rule.scheduleTime, rule.frequency);

      // Cập nhật rule: đặt lastRunAt và nextRunAt
      await db.autoPostRule.update({
        where: { id: ruleId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: nextRun,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Đã lưu kết quả đăng bài",
        nextRunAt: nextRun.toISOString(),
      });
    } else {
      // Nếu thất bại, vẫn cập nhật lastRunAt nhưng không tạo Post
      // Tính toán nextRunAt cho lần thử tiếp theo (có thể retry sau 1 giờ)
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + 1);

      await db.autoPostRule.update({
        where: { id: ruleId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: nextRun,
        },
      });

      return NextResponse.json({
        success: false,
        message: "Đăng bài thất bại",
        error: error ?? "Unknown error",
        nextRunAt: nextRun.toISOString(),
      });
    }
  } catch (error) {
    console.error("Report result error:", error);
    return NextResponse.json({ error: "Lỗi khi xử lý kết quả" }, { status: 500 });
  }
}

// Hàm tính toán thời gian chạy tiếp theo
function calculateNextRun(scheduleTime: string, frequency: string): Date {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(":").map(Number);
  const nextRun = new Date();

  if (frequency === "DAILY") {
    // Hàng ngày: đặt lịch cho ngày mai
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  } else if (frequency === "WEEKLY") {
    // Hàng tuần: đặt lịch cho 7 ngày sau
    nextRun.setDate(now.getDate() + 7);
    nextRun.setHours(hours, minutes, 0, 0);
  } else {
    // Mặc định: ngày mai
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  // Nếu thời gian đã qua trong ngày, đặt cho ngày mai
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

