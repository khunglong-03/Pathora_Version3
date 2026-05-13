# 🚀 Pathora Production Deployment Guide

## 📋 Tổng Quan

**Domain**: `https://cbbo-g99.io.vn`  
**Platform**: Dokploy  
**Architecture**: Nginx → Frontend + Backend APIs

---

## 📦 Files Quan Trọng

| File | Mô Tả | Action |
|------|-------|--------|
| `.env.dokploy` | Environment variables production | Đổi tên thành `.env` |
| `docker-compose.production.yml` | Docker compose config | Đổi tên thành `docker-compose.yml` |
| `nginx/default.conf` | Nginx routing config | Giữ nguyên |
| `ENV_COMPARISON.md` | So sánh .env cũ vs mới | Đọc để hiểu thay đổi |
| `FINAL_CHECKLIST.md` | Checklist deploy | Follow từng bước |
| `DOKPLOY_DEPLOY.md` | Hướng dẫn chi tiết | Đọc khi cần troubleshoot |
| `DEPLOY_QUICK_START.md` | Quick start guide | Đọc để deploy nhanh |

---

## 🔥 Vấn Đề Đã Sửa

### 1. **Login Issue** ✅
**Trước**: `NEXT_PUBLIC_API_GATEWAY=https://pathora-api.duckdns.org`  
**Sau**: `NEXT_PUBLIC_API_GATEWAY=` (empty)  
**Kết quả**: Login hoạt động, cookies được lưu

### 2. **Security Issue** ✅
**Trước**: `Auth__DisableAuthorization=true`  
**Sau**: `Auth__DisableAuthorization=false`  
**Kết quả**: Bật authorization cho production

### 3. **CORS Issue** ✅
**Trước**: Không có CORS config  
**Sau**: `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`  
**Kết quả**: Không còn CORS errors

### 4. **JWT Issue** ✅
**Trước**: `Jwt__Issuer=http://localhost:5812`  
**Sau**: `Jwt__Issuer=https://cbbo-g99.io.vn`  
**Kết quả**: JWT valid cho production

### 5. **Frontend Config Issue** ✅
**Trước**: Thiếu `FRONTEND_NODE_ENV`, `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS`  
**Sau**: Đã thêm đầy đủ config  
**Kết quả**: Frontend build production mode

---

## 🚀 Quick Start (3 Bước)

### Bước 1: Upload Files
```bash
# Upload 3 files này lên Dokploy:
1. .env.dokploy → đổi tên thành .env
2. docker-compose.production.yml → đổi tên thành docker-compose.yml
3. nginx/default.conf (giữ nguyên)
4. Toàn bộ source code
```

### Bước 2: Cấu Hình Dokploy
```bash
# Trong Dokploy dashboard:
1. Tạo project: pathora
2. Type: Docker Compose
3. Copy environment variables từ .env.dokploy
4. Add domain: cbbo-g99.io.vn
5. Enable SSL/TLS
```

### Bước 3: Deploy & Test
```bash
# Click Deploy button

# Test sau khi deploy:
curl https://cbbo-g99.io.vn
curl https://cbbo-g99.io.vn/health/api
curl https://cbbo-g99.io.vn/health/public
```

---

## 📊 Architecture

```
Browser
   ↓
https://cbbo-g99.io.vn (Dokploy SSL)
   ↓
Nginx (port 80)
   ├─→ / → Frontend (Next.js, port 3003)
   ├─→ /api/auth/* → PublicApi (port 8081)
   ├─→ /api/public/* → PublicApi (port 8081)
   └─→ /api/* → Backend (port 8080)
```

**Lợi ích**:
- ✅ Single domain → cookies hoạt động
- ✅ No CORS issues
- ✅ SSL/TLS tự động
- ✅ Secure (không expose internal ports)

---

## ⚠️ Quan Trọng

### MUST DO
- [ ] `Auth__DisableAuthorization=false` (MUST be false)
- [ ] `Dev__EnableDevEndpoints=false` (MUST be false)
- [ ] `NEXT_PUBLIC_API_GATEWAY=` (MUST be empty)
- [ ] `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`

### MUST NOT DO
- [ ] ❌ Không dùng `Auth__DisableAuthorization=true` trong production
- [ ] ❌ Không dùng `Dev__EnableDevEndpoints=true` trong production
- [ ] ❌ Không set `NEXT_PUBLIC_API_GATEWAY` thành domain khác
- [ ] ❌ Không expose port 3003 ra ngoài

---

## 🔍 Troubleshooting

### Container name conflict?
```bash
# Error: container name already in use

# Fix: Run cleanup script
.\cleanup-old-containers.ps1  # Windows
./cleanup-old-containers.sh   # Linux/Mac

# Or manual:
docker rm -f pathora-backend pathora-publicapi pathora-frontend pathora-nginx

# See: FIX_CONTAINER_CONFLICT.md
```

### Login không hoạt động?
```bash
# Check:
1. NEXT_PUBLIC_API_GATEWAY phải empty
2. Cors__AllowedOrigins__0=https://cbbo-g99.io.vn
3. Browser cookies (DevTools → Application → Cookies)

# Fix:
docker restart pathora-backend pathora-publicapi
```

### 404 Not Found?
```bash
# Check:
1. Nginx config đã mount đúng
2. Nginx logs: docker logs pathora-nginx

# Fix:
docker restart pathora-nginx
```

### CORS errors?
```bash
# Check:
1. Cors__AllowedOrigins__0 trong environment variables
2. Domain không có trailing slash

# Fix:
docker restart pathora-backend pathora-publicapi
```

---

## 📚 Tài Liệu

| File | Khi Nào Đọc |
|------|-------------|
| `DEPLOY_QUICK_START.md` | Muốn deploy nhanh |
| `FINAL_CHECKLIST.md` | Đang deploy, cần checklist |
| `ENV_COMPARISON.md` | Muốn hiểu thay đổi .env |
| `DOKPLOY_DEPLOY.md` | Cần hướng dẫn chi tiết |
| `README_DEPLOY.md` | File này - tổng quan |

---

## ✅ Deployment Status

- [x] Files created
- [x] Environment variables fixed
- [x] Docker compose configured
- [x] Nginx routing configured
- [x] Security settings correct
- [x] Documentation complete

**Status**: 🎉 **READY TO DEPLOY**

---

## 🆘 Support

Nếu gặp vấn đề:
1. Check `FINAL_CHECKLIST.md` → Troubleshooting section
2. Check logs: `docker logs [container-name]`
3. Check `DOKPLOY_DEPLOY.md` → Detailed guide

---

**Domain**: https://cbbo-g99.io.vn  
**Platform**: Dokploy  
**Last Updated**: 2026-05-14
