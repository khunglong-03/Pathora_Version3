## ADDED Requirements

### Requirement: Public Tunnel Backend Access

Backend đang chạy local tại `http://localhost:5182` SHALL được expose qua public tunnel URL để Vercel frontend có thể gọi API từ domain `*.vercel.app`.

#### Scenario: Cloudflare Tunnel exposes local backend
- **WHEN** developer chạy `cloudflared tunnel --url http://localhost:5182`
- **THEN** một public HTTPS URL được tạo (ví dụ: `https://random-name.trycloudflare.com`)
- **AND** requests từ Vercel frontend tới URL đó được forward về `localhost:5182`

### Requirement: CORS AllowedOrigins Configuration

Backend SHALL cho phép CORS requests từ tất cả Vercel preview và production URLs (`*.vercel.app`) và localhost development.

#### Scenario: CORS preflight request from Vercel frontend
- **WHEN** Vercel frontend gửi preflight (OPTIONS) request tới backend tunnel URL
- **THEN** backend trả về response với header `Access-Control-Allow-Origin` chứa origin của request
- **AND** header `Access-Control-Allow-Credentials: true`
- **AND** header `Access-Control-Allow-Methods: *`
- **AND** header `Access-Control-Allow-Headers: *`

#### Scenario: CORS config supports multiple environments
- **WHEN** backend đọc `AllowedOrigins` từ config
- **THEN** mỗi origin phải là một phần tử riêng biệt trong mảng JSON
- **AND** wildcard pattern `*.vercel.app` được hỗ trợ để cover mọi Vercel preview URLs
