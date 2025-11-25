# Hướng dẫn cấu hình Environment Variables

## File `.env` hoặc `.env.local`

Thêm các biến môi trường sau vào file `.env` hoặc `.env.local`:

```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"

# Auth
AUTH_SECRET="your-auth-secret-here"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# OpenAI (cho AI generation)
OPENAI_API_KEY="sk-your-openai-api-key"

# n8n Integration
N8N_WEBHOOK_URL="https://vudq.app.n8n.cloud/webhook/31962cc6-90c9-40fd-a973-6c40a4607867"
N8N_API_KEY="your-secret-api-key-here"
```

## Lấy N8N Webhook URL

### Bước 1: Import workflow vào n8n
1. Mở n8n Dashboard
2. Click "Workflows" → "Import from File"
3. Chọn file `n8n-workflow.json`
4. Workflow sẽ được import

### Bước 2: Activate workflow
1. Click nút **"Active"** ở góc trên bên phải trong n8n
2. Workflow sẽ được activate

### Bước 3: Copy Webhook URL
1. Click vào node **"Webhook Trigger"**
2. Copy **Production Webhook URL** (không phải test URL)
3. URL sẽ có dạng:
   ```
   https://vudq.app.n8n.cloud/webhook/your-webhook-id
   ```
   (Không có `/webhook-test/`)

### Bước 4: Cập nhật `.env`
Thêm hoặc cập nhật dòng:
```env
N8N_WEBHOOK_URL="https://vudq.app.n8n.cloud/webhook/your-webhook-id"
```

### Bước 5: Restart Server
Sau khi cập nhật `.env`:
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

## Lưu ý

- **Test Mode vs Production Mode:**
  - Test URL: `https://.../webhook-test/...` - chỉ hoạt động sau khi click "Execute workflow"
  - Production URL: `https://.../webhook/...` - hoạt động liên tục sau khi activate

- **N8N_API_KEY:** Tùy chọn, nhưng khuyến nghị để bảo mật API endpoints

- **File `.env.local`:** Nếu có file này, Next.js sẽ ưu tiên dùng nó thay vì `.env`

## Kiểm tra

Sau khi cấu hình, test bằng cách:
1. Tạo một rule
2. Click "Chạy thử" để generate preview
3. Click "Xác nhận đăng bài"
4. Nếu không có lỗi "N8N webhook URL chưa được cấu hình" → thành công!

