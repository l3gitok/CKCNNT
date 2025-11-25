# Hướng dẫn Import và Setup n8n Workflow

## File Workflow

File `n8n-workflow.json` đã được tạo với đầy đủ các node cần thiết.

## Flow hoạt động

1. **Webhook Trigger** - Nhận payload từ hệ thống
2. **Parse Input** - Parse dữ liệu (previewText, product, pageId, pageToken)
3. **Prepare Images** - Chuẩn bị danh sách images từ product
4. **Upload Image** - Upload từng image lên Facebook (loop)
5. **Build Media Array** - Tạo array media từ uploaded images
6. **Create Post** - Đăng bài lên Facebook Page với caption và images
7. **Get Post Stats** - Lấy thống kê từ Facebook (views, interactions, shares, comments)
8. **Prepare Report Data** - Format dữ liệu để gửi về hệ thống
9. **Save Post to DB** - Gọi API `/api/n8n/report-result` để lưu vào database

## Cách Import vào n8n

1. **Mở n8n Dashboard**
2. **Click "Workflows" → "Import from File"**
3. **Chọn file `n8n-workflow.json`**
4. **Workflow sẽ được import với tất cả nodes**

## Cấu hình cần thiết

### 1. Webhook URL

Sau khi import, copy webhook URL và cập nhật vào `.env`:
```env
N8N_WEBHOOK_URL=https://vudq.app.n8n.cloud/webhook/your-webhook-id
```

### 2. Credentials cần setup

#### a. N8N API Key (cho Save Post to DB node)
- Tạo credential: **HTTP Header Auth**
- Name: `N8N API Key`
- Header Name: `Authorization`
- Header Value: `Bearer YOUR_N8N_API_KEY`

#### b. Facebook Token (nếu cần, nhưng thường dùng pageToken từ payload)
- Có thể bỏ qua vì đã dùng `pageToken` từ payload

### 3. Cập nhật URL trong Save Post to DB node

Thay `YOUR_DOMAIN.com` bằng domain thực tế của bạn:
```
https://your-actual-domain.com/api/n8n/report-result
```

## Payload từ hệ thống

Khi user click "Xác nhận đăng bài", hệ thống gửi:

```json
{
  "ruleId": "rule-id",
  "ruleName": "Tên quy tắc",
  "platform": "FACEBOOK",
  "previewText": "Text đã được user chỉnh sửa",
  "product": {
    "id": "product-id",
    "name": "Tên sản phẩm",
    "description": "Mô tả",
    "imageUrls": ["url1", "url2"]
  },
  "pageId": "facebook-page-id",
  "pageName": "Tên Page",
  "pageToken": "encrypted-page-token",
  "userId": "user-id",
  "triggerType": "manual"
}
```

## Lưu ý quan trọng

1. **Preview Text**: Workflow sử dụng `previewText` từ payload (đã được user chỉnh sửa)
2. **Xóa Preview**: Sau khi trigger thành công, hệ thống tự động xóa `preview` data trong rule
3. **Error Handling**: Workflow có node "Check Error" để xử lý lỗi và vẫn gọi report-result
4. **Stats**: Workflow lấy views từ `insights.metric(post_impressions)` và interactions từ `reactions.summary`

## Testing

1. **Activate workflow** trong n8n
2. **Tạo rule và preview** trong web
3. **Click "Xác nhận đăng bài"**
4. **Kiểm tra logs** trong n8n để xem quá trình xử lý
5. **Kiểm tra bảng Post** trong database để xem dữ liệu đã được lưu

## Troubleshooting

### Lỗi upload image
- Kiểm tra image URLs phải là public URLs
- Kiểm tra pageToken có quyền `pages_manage_posts`

### Lỗi get stats
- Facebook có thể mất vài phút để cập nhật stats
- Có thể thêm delay node trước Get Post Stats

### Lỗi save to DB
- Kiểm tra N8N_API_KEY trong `.env`
- Kiểm tra URL domain trong Save Post to DB node

