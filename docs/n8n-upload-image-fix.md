# Sửa lỗi Upload Image trong n8n Workflow

## Vấn đề: Workflow dừng ở Upload Image

Workflow dừng ở node "Upload Image" có thể do:

1. **Image URL không accessible** - Facebook không thể truy cập image URL
2. **Format attached_media sai** - Facebook API yêu cầu format đặc biệt
3. **Page Token không có quyền** - Token không có quyền upload photos

## Cách sửa

### 1. Kiểm tra Upload Image Node

**URL:** `https://graph.facebook.com/v21.0/{{$json.pageId}}/photos`

**Body Parameters:**
```json
{
  "url": "={{$json.image}}",
  "published": "false",
  "access_token": "={{$json.pageToken}}"
}
```

**Lưu ý:**
- `url` phải là public URL, Facebook có thể truy cập được
- `published: false` để upload nhưng chưa publish
- Response sẽ trả về `{id: "photo-id"}`

### 2. Kiểm tra Build Media Array Node

Code đã được cập nhật để:
- Filter các images upload thành công
- Format đúng cho Facebook API
- Log media array để debug

### 3. Kiểm tra Create Post Node

**URL:** `https://graph.facebook.com/v21.0/{{$json.pageId}}/feed`

**Body Parameters:**
```json
{
  "attached_media": "={{$json.mediaString}}",
  "message": "={{$json.previewText}}",
  "access_token": "={{$json.pageToken}}"
}
```

**Lưu ý quan trọng:**
- `attached_media` phải là **stringified JSON array**
- Format: `[{"media_fbid":"photo-id-1"},{"media_fbid":"photo-id-2"}]`
- Không phải object, không phải array trực tiếp

### 4. Debug trong n8n

1. **Click vào node "Upload Image"** → Xem output
   - Kiểm tra có `id` trong response không
   - Kiểm tra có error không

2. **Click vào node "Build Media Array"** → Xem output
   - Kiểm tra `media` array có đúng format không
   - Kiểm tra `mediaString` có đúng không

3. **Click vào node "Create Post"** → Xem error
   - Nếu lỗi về `attached_media`, kiểm tra format
   - Nếu lỗi về permission, kiểm tra page token

## Các lỗi thường gặp

### Lỗi 1: "Invalid parameter"
→ `attached_media` format sai. Phải là stringified JSON array.

### Lỗi 2: "Invalid OAuth access token"
→ Page token không hợp lệ hoặc đã hết hạn.

### Lỗi 3: "Insufficient permissions"
→ Page token không có quyền `pages_manage_posts`.

### Lỗi 4: "Cannot access image URL"
→ Image URL không public hoặc không accessible từ Facebook servers.

## Test từng bước

1. **Test Upload Image:**
   - Dùng Postman/curl test upload 1 image
   - Kiểm tra response có `id` không

2. **Test Create Post:**
   - Dùng Postman/curl test create post với `attached_media`
   - Format: `attached_media=[{"media_fbid":"test-id"}]`

3. **Test trong n8n:**
   - Execute từng node một
   - Xem output của mỗi node

## Workflow đã được cập nhật

File `n8n-workflow.json` đã được cập nhật với:
- Error handling trong Build Media Array
- Format đúng cho `attached_media`
- Logging để debug

Import lại workflow và test!

