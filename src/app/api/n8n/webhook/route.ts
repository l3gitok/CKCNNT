// src/app/api/n8n/webhook/route.ts
// Webhook endpoint để trigger n8n workflow (nếu cần)
import { NextResponse } from "next/server";
// POST: Trigger n8n workflow (nếu bạn muốn hệ thống gọi n8n thay vì n8n poll)
export async function POST(request: Request) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    return NextResponse.json({ error: "N8N webhook URL chưa được cấu hình" }, { status: 500 });
  }

  const body = (await request.json()) as unknown;

  try {
    // Gọi n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`N8N webhook failed: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;

    return NextResponse.json({
      success: true,
      data,
    } as { success: boolean; data: unknown });
  } catch (error) {
    console.error("N8N webhook error:", error);
    return NextResponse.json(
      {
        error: "Lỗi khi gọi N8N webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
