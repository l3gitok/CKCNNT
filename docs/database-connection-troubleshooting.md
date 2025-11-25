# Hướng dẫn xử lý lỗi kết nối Database

## Lỗi: Can't reach database server

Lỗi này xảy ra khi ứng dụng không thể kết nối đến Supabase database.

## Các nguyên nhân và cách xử lý

### 1. Kiểm tra DATABASE_URL trong `.env`

Đảm bảo file `.env` có `DATABASE_URL` đúng format:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**Lưu ý:**
- Thay `[PASSWORD]` bằng password thực tế của bạn
- URL phải có `?pgbouncer=true&connection_limit=1` nếu dùng connection pooler
- URL phải được đặt trong dấu ngoặc kép `"`

### 2. Lấy DATABASE_URL từ Supabase

1. **Mở Supabase Dashboard**: https://supabase.com/dashboard
2. **Chọn project** của bạn
3. **Vào Settings → Database**
4. **Copy Connection String**:
   - Chọn **Connection pooling** (Transaction mode)
   - Copy connection string
   - Paste vào `.env` file

### 3. Kiểm tra Supabase Project Status

1. **Mở Supabase Dashboard**
2. **Kiểm tra project có đang Active không**
3. **Kiểm tra có bị pause do inactivity không** (free tier có thể bị pause)
4. Nếu bị pause, click **Resume** để kích hoạt lại

### 4. Thử Direct Connection thay vì Pooler

Nếu connection pooler không hoạt động, thử dùng direct connection:

**Connection Pooler URL:**
```
postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Direct Connection URL:**
```
postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

Hoặc lấy từ Supabase Dashboard → Settings → Database → Connection string (Direct connection)

### 5. Kiểm tra Firewall/Network

- Đảm bảo không có firewall block port 5432 hoặc 6543
- Kiểm tra network connection
- Thử ping đến `aws-1-ap-south-1.pooler.supabase.com`

### 6. Test Connection bằng Prisma Studio

```bash
npx prisma studio
```

Nếu Prisma Studio không kết nối được, vấn đề là ở DATABASE_URL hoặc network.

### 7. Test Connection bằng psql (nếu có)

```bash
psql "postgresql://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
```

### 8. Kiểm tra Connection String Format

**Đúng:**
```
postgresql://user:password@host:port/database?params
```

**Sai:**
- Thiếu `postgresql://` prefix
- Password có ký tự đặc biệt chưa được encode (URL encode)
- Thiếu port number

### 9. Encode Password nếu có ký tự đặc biệt

Nếu password có ký tự đặc biệt như `@`, `#`, `%`, cần URL encode:

- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`

### 10. Restart Development Server

Sau khi thay đổi `.env`:
1. **Stop server** (Ctrl+C)
2. **Restart server**: `npm run dev`

## Quick Fix Checklist

- [ ] DATABASE_URL có trong `.env` file
- [ ] DATABASE_URL đúng format (có `postgresql://` prefix)
- [ ] Password đã được thay thế (không còn `[PASSWORD]`)
- [ ] Supabase project đang Active (không bị pause)
- [ ] Đã restart server sau khi thay đổi `.env`
- [ ] Connection string có `?pgbouncer=true` nếu dùng pooler
- [ ] Password có ký tự đặc biệt đã được URL encode

## Liên hệ Support

Nếu vẫn không giải quyết được:
1. Kiểm tra Supabase Status: https://status.supabase.com/
2. Kiểm tra Supabase Dashboard → Logs để xem có error gì không
3. Liên hệ Supabase Support

