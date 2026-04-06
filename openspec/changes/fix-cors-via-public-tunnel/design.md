## Context

**Current state:**
- Backend: ASP.NET Core API chạy local tại `http://localhost:5182`
- Frontend: Next.js admin dashboard deploy trên Vercel tại `https://pathora-git-main-thehieu03s-projects.vercel.app`
- CORS config trong `appsettings.json` có `AllowedOrigins` bị format sai — 2 URL bị ghép thành 1 phần tử trong mảng
- Frontend mặc định production gọi `https://api.vivugo.me`, không phải `localhost:5182`
- Có duplicate CORS policy trong `DependencyInjection.cs` (dead code)

**Constraints:**
- Backend chạy local, không có public IP
- Cần public URL để Vercel frontend gọi về được
- Không muốn deploy backend lên production cloud (chỉ dùng local)

## Goals / Non-Goals

**Goals:**
- Vercel frontend có thể gọi API về backend local qua public tunnel
- CORS properly configured cho origin Vercel
- Frontend production build sử dụng tunnel URL thay vì `api.vivugo.me`

**Non-Goals:**
- Không deploy backend lên production cloud
- Không thay đổi auth flow hiện tại (JWT, cookies)
- Không sửa database connection strings
- Không setup CI/CD cho backend

## Decisions

### Decision 1: Public Tunnel Solution — Cloudflare Tunnel over ngrok

**Chọn:** Cloudflare Tunnel (zero-width tunnel)

**Alternatives:**
- **ngrok**: Phổ biến, dễ dùng, nhưng cần account và có rate limit trên free tier
- **localtunnel**: Miễn phí, không cần account, nhưng chậm và không ổn định
- **Cloudflare Tunnel**: Miễn phí, không cần account cho personal use, ổn định hơn ngrok, không có port forwarding

**Lý do:** Cloudflare Tunnel không cần đăng ký account để tạo tunnel tạm thời (`cloudflared tunnel --url`), tốc độ tốt, và không giới hạn như ngrok free tier.

### Decision 2: CORS Config Format — Separate Array Elements

**Fix:** Sửa `appsettings.json` `AllowedOrigins` từ 1 phần tử ghép thành 2 phần tử riêng biệt:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:3003",
    "https://pathora-git-main-thehieu03s-projects.vercel.app"
  ]
}
```

### Decision 3: Frontend Environment — Configurable via env var

**Approach:** Frontend sẽ sử dụng `NEXT_PUBLIC_API_GATEWAY` environment variable trên Vercel. Giá trị sẽ là public tunnel URL.

Vercel project settings sẽ được cấu hình:
- `NEXT_PUBLIC_API_GATEWAY` = `<tunnel-URL>` (ví dụ: `https://random-name.trycloudflare.com`)

### Decision 4: CORS Credentials — Keep `AllowCredentials`

Giữ nguyên `.AllowCredentials()` vì auth flow sử dụng cookies. Khi dùng `AllowCredentials()` với wildcard origin thì browser tự reject, nên origin phải được specify chính xác — đây là lý do cần fix format `AllowedOrigins`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Tunnel URL thay đổi mỗi lần restart | Script khởi động tunnel + backend, hướng dẫn cập nhật Vercel env var khi URL đổi |
| Cloudflare tunnel bị disconnect | Backend vẫn chạy, chỉ cần restart tunnel |
| CORS preflight (OPTIONS) bị block | Backend đã có `app.UseCors()` đúng thứ tự trước authentication |
| Duplicate dead CORS policy | Xóa policy trong `DependencyInjection.cs`, giữ `DefaultCorsPolicy` trong `Program.cs` |

## Migration Plan

1. **Step 1**: Fix `appsettings.json` CORS format
2. **Step 2**: Remove duplicate CORS policy trong `DependencyInjection.cs`
3. **Step 3**: Cài đặt `cloudflared`, chạy tunnel tới backend port 5182
4. **Step 4**: Copy tunnel URL, set `NEXT_PUBLIC_API_GATEWAY` trong Vercel project settings
5. **Step 5**: Redeploy hoặc trigger rebuild trên Vercel
6. **Step 6**: Test — gọi API từ Vercel frontend, verify CORS headers

**Rollback**: Đặt lại `NEXT_PUBLIC_API_GATEWAY` về giá trị cũ (`https://api.vivugo.me`) trong Vercel settings.

## Open Questions

1. **Vercel preview URL có thay đổi không?** Mỗi PR tạo một preview URL mới → Cần biết có cần hỗ trợ nhiều Vercel origins hay chỉ cần wildcard `*.vercel.app`. **Quyết định:** Dùng wildcard pattern `*.vercel.app` trong CORS để cover tất cả preview và production URLs.

2. **`api.vivugo.me` là gì?** Đây là production backend URL mặc định. Cần xác nhận đây là backend production thật hay chỉ là placeholder. **Quyết định tạm:** Giữ nguyên `api.vivugo.me` làm fallback, nhưng override bằng tunnel URL khi cần test local.

3. **SignalR connection?** SignalR trong frontend cũng gọi `API_GATEWAY_BASE_URL` cho hub connection. Cần verify SignalR hoạt động qua tunnel URL (thường没问题 nhưng cần test).
