# Sửa lỗi N8N Webhook

## Vấn đề 1: Tên biến môi trường sai

**Lỗi:** Bạn đang dùng `N8N_WEB_HOOK` nhưng code cần `N8N_WEBHOOK_URL`

**Cách sửa:**
1. Mở file `.env` hoặc `.env.local`
2. Thay đổi:
   ```env
   # SAI
   N8N_WEB_HOOK="https://l3gitok.app.n8n.cloud/webhook-test/fb-autopost"
   
   # ĐÚNG
   N8N_WEBHOOK_URL="https://l3gitok.app.n8n.cloud/webhook-test/fb-autopost"
   ```
3. Restart server

## Vấn đề 2: Test Mode vs Production Mode

**URL hiện tại:** `https://l3gitok.app.n8n.cloud/webhook-test/fb-autopost`

URL có `/webhook-test/` nghĩa là đang ở **test mode**. Trong test mode:
- Webhook chỉ hoạt động **một lần** sau khi click "Execute workflow"
- Sau mỗi lần execute, phải click lại

**Giải pháp: Activate workflow để có Production URL**

1. **Mở workflow trong n8n**
2. **Click nút "Active"** (góc trên bên phải)
3. **Copy Production Webhook URL** từ node "Webhook Trigger"
4. URL sẽ thay đổi thành:
   ```
   https://l3gitok.app.n8n.cloud/webhook/fb-autopost
   ```
   (Không còn `/webhook-test/`)
5. **Cập nhật `.env`:**
   ```env
   N8N_WEBHOOK_URL="https://l3gitok.app.n8n.cloud/webhook/fb-autopost"
   ```
6. **Restart server**

## Vấn đề 3: Lỗi 500 - Debug

Lỗi 500 có thể do:
1. **Database connection error** - Kiểm tra `DATABASE_URL`
2. **Rule không tồn tại** - Kiểm tra `ruleId` có đúng không
3. **User chưa có pageId/token** - Kiểm tra user đã kết nối Facebook Page chưa
4. **n8n webhook không phản hồi** - Kiểm tra workflow có đang active không

**Cách debug:**
1. Mở **Browser DevTools** → **Console**
2. Xem error message chi tiết
3. Kiểm tra **Network tab** → Request `/api/n8n/trigger` → Xem Response
4. Kiểm tra **Server logs** trong terminal để xem error chi tiết

## Checklist

- [ ] Đã đổi tên biến từ `N8N_WEB_HOOK` → `N8N_WEBHOOK_URL`
- [ ] Đã activate workflow trong n8n
- [ ] Đã copy Production Webhook URL (không có `/webhook-test/`)
- [ ] Đã cập nhật `.env` với URL đúng
- [ ] Đã restart server
- [ ] User đã kết nối Facebook Page (có `pageId` và `encryptedPageToken`)
- [ ] Rule đang ở trạng thái ACTIVE
- [ ] Rule có ít nhất 1 sản phẩm

## Test

Sau khi sửa:
1. Tạo/chỉnh sửa rule
2. Click "Chạy thử" để generate preview
3. Click "Xác nhận đăng bài"
4. Kiểm tra:
   - Không có lỗi "N8N webhook URL chưa được cấu hình"
   - Không có lỗi 500
   - Preview data đã được xóa
   - n8n workflow đã nhận được request

