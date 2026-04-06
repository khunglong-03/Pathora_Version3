## 1. Backend CORS Configuration

- [x] 1.1 Fix `appsettings.json` CORS `AllowedOrigins` format — tách 2 URL thành 2 phần tử riêng biệt
- [x] 1.2 Thêm wildcard pattern `*.vercel.app` vào `AllowedOrigins` để cover mọi Vercel preview URLs
- [x] 1.3 Verify `appsettings.Development.json` CORS format cũng đúng (đã đúng, chỉ verify)
- [x] 1.4 Remove duplicate CORS policy trong `DependencyInjection.cs` (dead code)
- [ ] 1.5 Rebuild backend và restart để apply config changes

## 2. Frontend Environment Configuration

- [x] 2.1 Kiểm tra `apiGateway.ts` — xác nhận `NEXT_PUBLIC_API_GATEWAY` được resolve đúng way
- [x] 2.2 Tạo `.env.local.example` với template `NEXT_PUBLIC_API_GATEWAY=<tunnel-URL>` để developer biết cách set

## 3. Tunnel Setup & Deployment

- [ ] 3.1 Hướng dẫn cài đặt `cloudflared` (Windows: winget/choco, macOS: brew)
- [x] 3.2 Tạo script `start-tunnel.ps1` để chạy `cloudflared tunnel --url http://localhost:5182`
- [x] 3.3 Tạo script `start-dev.ps1` chạy cả backend + tunnel cùng lúc
- [ ] 3.4 Hướng dẫn cách copy tunnel URL và set `NEXT_PUBLIC_API_GATEWAY` trong Vercel project settings
- [ ] 3.5 Redeploy hoặc trigger rebuild trên Vercel để apply env var mới

## 4. Verification

- [ ] 4.1 Test: Gọi API endpoint từ trình duyệt (truy cập Vercel frontend) — verify CORS headers có mặt
- [ ] 4.2 Test: Verify SignalR connection hoạt động qua tunnel URL
- [ ] 4.3 Test: Verify auth flow (login) hoạt động qua tunnel với credentials
