# Hướng dẫn Setup n8n Workflow cho Auto Facebook Posting

## Phân tích Workflow hiện tại

Workflow của bạn có các node:
1. **Webhook Trigger** - Nhận POST request từ hệ thống
2. **Parse Input** - Parse dữ liệu đầu vào
3. **Fetch Product** - Lấy product từ Supabase (có thể bỏ qua vì đã có trong payload)
4. **Select Product** - Chọn product đầu tiên
5. **AI Caption** - Generate caption bằng OpenAI (chưa được kết nối)
6. **Resolve Caption** - Lấy caption từ AI response
7. **Prepare Images** - Chuẩn bị images từ product
8. **Upload Image** - Upload từng image lên Facebook
9. **Build Media Array** - Build media array từ uploaded images
10. **Create Post** - Tạo post trên Facebook
11. **Save Post DB** - Lưu post vào database

## Payload từ hệ thống

Khi trigger từ web, hệ thống gửi payload:

```json
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
    "description": "Mô tả sản phẩm",
    "imageUrls": ["url1", "url2"]
  },
  "pageId": "facebook-page-id",
  "pageName": "Tên Page",
  "pageToken": "encrypted-page-token",
  "userId": "user-id",
  "triggerType": "manual"
}
```

## Cải thiện Workflow

### 1. Cập nhật Parse Input Node

Thay vì chỉ lấy item đầu tiên, nên parse toàn bộ payload:

```javascript
// Parse Input Node
const input = $input.first().json;

return [{
  ruleId: input.ruleId,
  ruleName: input.ruleName,
  promptTemplate: input.promptTemplate,
  product: input.product,
  pageId: input.pageId,
  pageName: input.pageName,
  pageToken: input.pageToken, // Cần decrypt nếu đã encrypt
  userId: input.userId,
  triggerType: input.triggerType
}];
```

### 2. Bỏ qua Fetch Product Node

Vì product đã có trong payload, không cần fetch lại từ Supabase. Có thể:
- Xóa node "Fetch Product" và "Select Product"
- Hoặc giữ lại làm fallback nếu product không có trong payload

### 3. Kết nối AI Caption Node

**Cập nhật AI Caption Node:**

```javascript
// AI Caption Node - Body Parameters
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "Bạn là một chuyên gia viết nội dung marketing cho Facebook. Viết bài đăng hấp dẫn, tự nhiên, không quá dài."
    },
    {
      "role": "user",
      "content": `{{$json.promptTemplate}}\n\nSản phẩm: {{$json.product.name}}\nMô tả: {{$json.product.description}}`
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

**Kết nối:**
- Parse Input → AI Caption (thêm connection)
- AI Caption → Resolve Caption (đã có)

### 4. Cập nhật Prepare Images Node

```javascript
// Prepare Images Node
const product = $json.product;
const imageUrls = product?.imageUrls || [];

return imageUrls.map(url => ({
  image: url,
  pageId: $json.pageId,
  pageToken: $json.pageToken,
  productId: product.id
}));
```

### 5. Cập nhật Upload Image Node

```javascript
// Upload Image Node - URL
https://graph.facebook.com/v21.0/{{$json.pageId}}/photos

// Body Parameters
{
  "url": "={{$json.image}}",
  "published": "false",
  "access_token": "={{$json.pageToken}}"
}
```

### 6. Cập nhật Create Post Node

```javascript
// Create Post Node - URL
https://graph.facebook.com/v21.0/{{$('Parse Input').item.json.pageId}}/feed

// Body Parameters (multipart-form-data)
{
  "attached_media": "={{JSON.stringify($('Build Media Array').item.json.media)}}",
  "message": "={{$('Resolve Caption').item.json.message}}",
  "access_token": "={{$('Parse Input').item.json.pageToken}}"
}
```

**Lưu ý:** `attached_media` phải là array of objects:
```json
[
  {"media_fbid": "photo-id-1"},
  {"media_fbid": "photo-id-2"}
]
```

### 7. Cập nhật Save Post DB Node

Thay vì gọi Supabase REST API, nên gọi API của hệ thống:

```javascript
// Save Post DB Node - URL
https://your-domain.com/api/n8n/report-result

// Body Parameters
{
  "ruleId": "={{$('Parse Input').item.json.ruleId}}",
  "success": true,
  "postUrl": "={{`https://facebook.com/${$('Create Post').item.json.id}`}}",
  "postId": "={{$('Create Post').item.json.id}}",
  "pageId": "={{$('Parse Input').item.json.pageId}}",
  "pageName": "={{$('Parse Input').item.json.pageName}}",
  "productId": "={{$('Parse Input').item.json.product.id}}",
  "views": 0,
  "interactions": 0,
  "shares": 0,
  "comments": 0
}
```

**Headers:**
```
Authorization: Bearer YOUR_N8N_API_KEY
Content-Type: application/json
```

## Workflow Flow đề xuất

```
Webhook Trigger
    ↓
Parse Input (parse payload từ hệ thống)
    ↓
    ├─→ AI Caption (generate caption từ promptTemplate + product)
    │       ↓
    │   Resolve Caption
    │       ↓
    └─→ Prepare Images (từ product.imageUrls)
            ↓
        Upload Image (loop qua từng image)
            ↓
        Build Media Array
            ↓
        Create Post (kết hợp caption + images)
            ↓
        Save Post DB (gọi /api/n8n/report-result)
```

## Xử lý lỗi

Thêm Error Handling nodes:

1. **IF Node** sau Create Post:
   - Nếu thành công → Save Post DB với `success: true`
   - Nếu thất bại → Save Post DB với `success: false` và `error: message`

2. **Catch Error Node** để bắt mọi lỗi và gọi report-result với `success: false`

## Decrypt Page Token

Nếu `pageToken` đã được encrypt, cần thêm node để decrypt:

```javascript
// Decrypt Token Node (nếu cần)
const encryptedToken = $json.pageToken;
// Thực hiện decrypt logic
const decryptedToken = decrypt(encryptedToken);
return [{ ...$json, pageToken: decryptedToken }];
```

## Testing

1. **Test với n8n Test Mode:**
   - Click "Execute workflow" trong n8n
   - Gửi test payload từ Postman/curl

2. **Test với Production:**
   - Activate workflow
   - Click "Đăng ngay" trong web
   - Kiểm tra logs trong n8n

## Lưu ý quan trọng

1. **Page Token:** Đảm bảo token có quyền `pages_manage_posts` và `pages_read_engagement`
2. **Image URLs:** Phải là public URLs, Facebook có thể truy cập được
3. **Rate Limits:** Facebook có rate limits, không nên đăng quá nhiều bài trong thời gian ngắn
4. **Error Handling:** Luôn gọi `/api/n8n/report-result` dù thành công hay thất bại

