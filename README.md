# 🗺️ Pathora (Version 3)

**Pathora** là nền tảng quản lý du lịch và đồng thiết kế hành trình Tour (Co-Design) toàn diện. Dự án được phát triển theo mô hình monorepo hiện đại với backend hiệu năng cao (.NET 10) và ứng dụng frontend Next.js 16.

---

## 🚀 Công Nghệ Cốt Lõi

*   **Frontend:** Next.js 16 (App Router) | React 18.3.1 | Tailwind CSS v4 | Redux Toolkit & RTK Query
*   **Backend:** .NET 10 | Clean Architecture | CQRS (MediatR) | Entity Framework Core | SignalR
*   **Hạ tầng:** Docker Compose | PostgreSQL 17 | Redis 7 | Nginx Reverse Proxy

---

## 📁 Cấu Trúc Thư Mục Rút Gọn

*   [`pathora/frontend/`](file:///Users/mac/Documents/GitHub/Pathora_Version3/pathora/frontend/): Ứng dụng Frontend Next.js chính.
*   [`panthora_be/`](file:///Users/mac/Documents/GitHub/Pathora_Version3/panthora_be/): Ứng dụng Backend API .NET 10 chính.
*   [`nginx/`](file:///Users/mac/Documents/GitHub/Pathora_Version3/nginx/): Cấu hình định tuyến Reverse Proxy local.
*   [`openspec/`](file:///Users/mac/Documents/GitHub/Pathora_Version3/openspec/): Tài liệu đặc tả tính năng và quản lý thay đổi tiếng Việt.

---

## 🛠️ Khởi Chạy Nhanh (Quick Start)

Để khởi động toàn bộ hệ thống (Frontend, Backend, Nginx, Database, Redis) tại môi trường local, chạy câu lệnh duy nhất sau ở thư mục gốc:

```bash
docker compose up -d
```

### Địa chỉ truy cập:
*   👉 **Môi trường cục bộ qua Nginx (Khuyên dùng):** `http://localhost/` hoặc `http://localhost:8099/` (Tránh lỗi CORS)
*   **Frontend trực tiếp:** `http://localhost:3003/`
*   **Backend API trực tiếp:** `http://localhost:8088/swagger` (Tài liệu API Swagger)

---

## 📖 Tài Liệu Hướng Dẫn Chi Tiết
*   Để biết cấu hình chi tiết và các lệnh phát triển/kiểm thử thủ công từng phần, tham khảo: [`AGENTS.md`](file:///Users/mac/Documents/GitHub/Pathora_Version3/AGENTS.md)
*   Quy tắc phát triển dành cho các AI Coding Assistants: [`CLAUDE.md`](file:///Users/mac/Documents/GitHub/Pathora_Version3/CLAUDE.md) / [`GEMINI.md`](file:///Users/mac/Documents/GitHub/Pathora_Version3/GEMINI.md)
