# Sửa Workflow để sử dụng Preview Data từ Database

## Vấn đề

Workflow cần lấy dữ liệu từ `preview` trong database với format:
```json
{
  "text": "nội dung bài viết",
  "imageUrl": "link của ảnh để đăng",
  "productName": "tên sản phẩm"
}
```

## Đã cập nhật

### 1. API Trigger (`/api/n8n/trigger`)

Đã cập nhật để gửi `preview` object:
```typescript
preview: {
  text: previewText, // Từ editedPreviewText hoặc preview.text
  imageUrl: previewImageUrl, // Từ preview.imageUrl hoặc product.imageUrls[0]
  productName: preview?.productName ?? selectedProduct.name
}
```

### 2. Parse Input Node

Đã cập nhật để lấy data từ `preview`:
```javascript
const preview = input.preview || {};
const previewText = preview.text || input.previewText || '';
const previewImageUrl = preview.imageUrl || '';
```

### 3. Prepare Images Node

Đã cập nhật để ưu tiên dùng `preview.imageUrl`:
```javascript
// Ưu tiên dùng imageUrl từ preview
const previewImageUrl = $json.previewImageUrl || '';
const productImageUrls = product?.imageUrls || [];

// Nếu có previewImageUrl, dùng nó; nếu không, dùng productImageUrls
const imageUrls = previewImageUrl ? [previewImageUrl] : productImageUrls;
```

## Flow hoạt động

1. **API Trigger** gửi payload với `preview` object:
   ```json
   {
     "preview": {
       "text": "...",
       "imageUrl": "...",
       "productName": "..."
     },
     "pageId": "...",
     "pageToken": "..."
   }
   ```

2. **Parse Input** node lấy:
   - `previewText` từ `preview.text`
   - `previewImageUrl` từ `preview.imageUrl`

3. **Prepare Images** node:
   - Ưu tiên dùng `previewImageUrl`
   - Nếu không có, fallback về `product.imageUrls[0]`

4. **Upload Image** node:
   - Upload image từ `previewImageUrl` lên Facebook

5. **Create Post** node:
   - Đăng bài với `previewText` và uploaded image

## Kiểm tra

1. **Kiểm tra payload trong n8n:**
   - Click vào "Parse Input" node
   - Xem output có `previewText` và `previewImageUrl` không

2. **Kiểm tra Prepare Images:**
   - Xem có image URL đúng không
   - Xem có log "Images to upload" không

3. **Kiểm tra Upload Image:**
   - Xem response có `id` không
   - Xem có error không

## Lưu ý

- **Preview imageUrl** phải là public URL, Facebook có thể truy cập được
- Nếu `preview.imageUrl` không có, sẽ fallback về `product.imageUrls[0]`
- Nếu cả hai đều không có, workflow sẽ throw error

