## Why

Frontend đang deploy trên Vercel (`https://pathora-git-main-thehieu03s-projects.vercel.app`) không thể gọi API về backend đang chạy local (`http://localhost:5182`) do lỗi CORS. Backend cần được expose qua public tunnel (ngrok/cloudflare tunnel) và CORS config phải được fix để cho phép origin Vercel.

## What Changes

- Fix `appsettings.json` CORS `AllowedOrigins` format (hiện tại bị ghép thành 1 phần tử thay vì 2)
- Thêm production URL của frontend Vercel vào CORS allowed origins
- Cấu hình để frontend Vercel gọi backend qua public tunnel URL
- Dọn dead code CORS policy trùng lặp trong `DependencyInjection.cs`
- Thêm script/hướng dẫn khởi động tunnel + chạy backend

## Capabilities

### New Capabilities

- `public-tunnel-backend`: Cấu hình để backend local được expose qua public tunnel (ngrok/cloudflare tunnel) với CORS đúng cho frontend Vercel

### Modified Capabilities

*(Không có spec hiện tại liên quan đến CORS — đây là capability mới)*

## Impact

- **Backend**: `panthora_be/src/Api/appsettings.json`, `panthora_be/src/Api/Program.cs`, `panthora_be/src/Api/DependencyInjection.cs`
- **Frontend**: `pathora/frontend/src/configs/apiGateway.ts` — cần cấu hình biến môi trường `NEXT_PUBLIC_API_GATEWAY`
- **Deployment**: Cần chạy ngrok/cloudflare tunnel mỗi khi muốn test frontend Vercel với backend local
