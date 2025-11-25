# Hướng dẫn Setup n8n Webhook

## Vấn đề: Webhook Test Mode

Khi sử dụng n8n webhook URL dạng:
```
https://vudq.app.n8n.cloud/webhook-test/31962cc6-90c9-40fd-a973-6c40a4607867
```

URL có `/webhook-test/` nghĩa là webhook đang ở **test mode**. Trong test mode:
- Webhook chỉ hoạt động **một lần** sau khi bạn click nút "Execute workflow" trên canvas
- Sau mỗi lần execute, bạn phải click lại để webhook hoạt động lần tiếp theo

## Giải pháp

### Cách 1: Activate Workflow (Khuyến nghị cho Production)

1. **Mở workflow trong n8n**
2. **Click nút "Active"** ở góc trên bên phải để activate workflow
3. **Copy Production Webhook URL** - URL sẽ thay đổi từ:
   ```
   https://vudq.app.n8n.cloud/webhook-test/...
   ```
   Thành:
   ```
   https://vudq.app.n8n.cloud/webhook/...
   ```
   (Không có `-test`)

4. **Cập nhật trong `.env`**:
   ```env
   N8N_WEBHOOK_URL=https://vudq.app.n8n.cloud/webhook/31962cc6-90c9-40fd-a973-6c40a4607867
   ```

5. **Restart server** để load env mới

### Cách 2: Sử dụng Test Mode (Chỉ để test)

Nếu muốn test ngay mà chưa activate workflow:

1. **Mở workflow trong n8n**
2. **Click nút "Execute workflow"** trên canvas
3. **Ngay lập tức** click button "Đăng ngay" trong web (trong vòng vài giây)
4. Webhook sẽ hoạt động **một lần duy nhất**
5. Muốn test lại, phải click "Execute workflow" lại

## Kiểm tra Webhook

### Test bằng curl:

```bash
curl -X POST https://vudq.app.n8n.cloud/webhook/31962cc6-90c9-40fd-a973-6c40a4607867 \
  -H "Content-Type: application/json" \
  -d '{
    "ruleId": "test",
    "ruleName": "Test Rule",
    "platform": "FACEBOOK"
  }'
```

### Response mong đợi:

**Nếu thành công:**
```json
{
  "success": true,
  "data": {...}
}
```

**Nếu webhook chưa được activate (test mode):**
```json
{
  "code": 404,
  "message": "The requested webhook \"...\" is not registered.",
  "hint": "Click the 'Execute workflow' button on the canvas, then try again."
}
```

## Lưu ý

- **Test Mode**: Chỉ dùng để test, không ổn định cho production
- **Production Mode**: Webhook hoạt động liên tục, không cần click "Execute workflow"
- **Security**: Production webhook vẫn cần được bảo vệ (có thể thêm authentication trong n8n)

## Troubleshooting

### Lỗi 404: Webhook not registered
→ Workflow chưa được activate hoặc đang ở test mode

### Lỗi 500: Internal server error
→ Kiểm tra workflow trong n8n có lỗi không

### Timeout
→ Kiểm tra network connection và n8n instance có đang chạy không

