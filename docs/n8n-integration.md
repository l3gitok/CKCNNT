# Hướng dẫn tích hợp n8n với Auto Marketing

## Tổng quan

Hệ thống cung cấp các API endpoint để n8n có thể:
1. Lấy danh sách quy tắc cần chạy (polling)
2. Báo cáo kết quả sau khi đăng bài
3. Nhận webhook từ hệ thống (tùy chọn)

## Cấu hình

### 1. Thêm biến môi trường

Thêm vào file `.env`:

```env
# API Key để bảo mật (tùy chọn, nhưng khuyến nghị)
N8N_API_KEY=your-secret-api-key-here

# N8N Webhook URL (nếu muốn hệ thống gọi n8n)
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-workflow-id
```

### 2. Cấu hình n8n Workflow

#### Workflow 1: Lấy danh sách quy tắc cần chạy

**HTTP Request Node:**
- Method: `GET`
- URL: `https://your-domain.com/api/n8n/pending-rules`
- Headers:
  ```
  Authorization: Bearer your-secret-api-key-here
  ```

**Response sẽ trả về:**
```json
{
  "rules": [
    {
      "ruleId": "rule-id",
      "ruleName": "Tên quy tắc",
      "platform": "FACEBOOK",
      "scheduleTime": "09:00",
      "frequency": "DAILY",
      "promptTemplate": "Viết bài về [PRODUCT_NAME]...",
      "preview": { "text": "...", "imageUrl": "..." },
      "product": {
        "id": "product-id",
        "name": "Tên sản phẩm",
        "description": "Mô tả",
        "imageUrls": ["url1", "url2"]
      },
      "pageId": "facebook-page-id",
      "pageToken": "encrypted-page-token",
      "userId": "user-id"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-01T09:00:00.000Z"
}
```

#### Workflow 2: Đăng bài lên Facebook Page

Sau khi lấy được dữ liệu từ API, n8n sẽ:

1. **Giải mã pageToken** (nếu cần)
2. **Thay thế placeholder** trong promptTemplate:
   - `[PRODUCT_NAME]` → product.name
   - `[PRODUCT_DESC]` → product.description
   - `[RULE_NAME]` → ruleName
   - `[SCHEDULE_TIME]` → scheduleTime
   - `[FREQUENCY]` → frequency
3. **Gọi Facebook Graph API** để đăng bài:
   ```
   POST https://graph.facebook.com/v18.0/{pageId}/feed
   Headers:
     Authorization: Bearer {pageToken}
   Body:
     message: {generatedText}
     attached_media: [{media_fbid: imageId}] (nếu có ảnh)
   ```
4. **Lấy thống kê** từ Facebook (nếu cần):
   ```
   GET https://graph.facebook.com/v18.0/{postId}?fields=shares,comments.summary(true),reactions.summary(true)
   ```

#### Workflow 3: Báo cáo kết quả

**HTTP Request Node:**
- Method: `POST`
- URL: `https://your-domain.com/api/n8n/report-result`
- Headers:
  ```
  Authorization: Bearer your-secret-api-key-here
  Content-Type: application/json
  ```
- Body:
  ```json
  {
    "ruleId": "rule-id",
    "success": true,
    "postUrl": "https://facebook.com/...",
    "postId": "facebook-post-id",
    "views": 100,
    "interactions": 50,
    "shares": 10,
    "comments": 5,
    "productId": "product-id"
  }
  ```

**Nếu thất bại:**
```json
{
  "ruleId": "rule-id",
  "success": false,
  "error": "Error message"
}
```

## Luồng hoạt động

### Cách 1: n8n Polling (Khuyến nghị)

1. **n8n Schedule Trigger** chạy mỗi 5-10 phút
2. Gọi `GET /api/n8n/pending-rules` để lấy danh sách quy tắc cần chạy
3. Với mỗi quy tắc:
   - Xử lý và đăng bài lên Facebook
   - Gọi `POST /api/n8n/report-result` để báo cáo kết quả
4. Hệ thống tự động cập nhật `nextRunAt` cho lần chạy tiếp theo

### Cách 2: Webhook (Tùy chọn)

Nếu muốn hệ thống trigger n8n:

1. Tạo n8n webhook node
2. Hệ thống gọi `POST /api/n8n/webhook` với dữ liệu rule
3. n8n xử lý và báo cáo kết quả

## Bảo mật

- Sử dụng `N8N_API_KEY` để bảo vệ các endpoint
- Đảm bảo n8n instance của bạn chỉ có thể truy cập từ mạng nội bộ hoặc VPN
- Mã hóa `pageToken` trong database (đã có sẵn `encryptedPageToken`)

## Xử lý lỗi

- Nếu đăng bài thất bại, hệ thống sẽ đặt `nextRunAt` = 1 giờ sau để retry
- Nếu thành công, `nextRunAt` sẽ được tính theo `frequency` (DAILY/WEEKLY)

## Testing

Bạn có thể test API bằng curl:

```bash
# Lấy danh sách quy tắc
curl -X GET https://your-domain.com/api/n8n/pending-rules \
  -H "Authorization: Bearer your-api-key"

# Báo cáo kết quả
curl -X POST https://your-domain.com/api/n8n/report-result \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ruleId": "rule-id",
    "success": true,
    "postUrl": "https://facebook.com/...",
    "views": 100,
    "interactions": 50,
    "shares": 10,
    "comments": 5
  }'
```

