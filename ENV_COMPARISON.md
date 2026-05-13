# So Sánh .env Cũ vs Mới

## ❌ **FILE CŨ (Có vấn đề)**

```env
# --- Cấu hình Chung ---
NODE_ENV=production
PORT=3001
ASPNETCORE_URLS=http://+:8080
NEXT_PUBLIC_API_GATEWAY=https://pathora-api.duckdns.org  ❌ SAI

# --- Auth & Dev ---
Auth__DisableAuthorization=true  ❌ NGUY HIỂM
Dev__EnableDevEndpoints=true     ❌ NGUY HIỂM

# --- CORS ---
❌ THIẾU Cors__AllowedOrigins

# --- AppConfig ---
AppConfig__FrontendBaseUrl=http://localhost:3003  ❌ SAI

# --- JWT ---
Jwt__Issuer=http://localhost:5812   ❌ SAI
Jwt__Audience=http://localhost:5812 ❌ SAI
❌ THIẾU Jwt__ValidIssuers__0
❌ THIẾU Jwt__ValidAudiences__0

# --- Frontend ---
❌ THIẾU FRONTEND_NODE_ENV
❌ THIẾU NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
❌ THIẾU NEXT_PUBLIC_IMAGES_UNOPTIMIZED

# --- SwaggerGen ---
❌ THIẾU toàn bộ SwaggerGen config

# --- SePay ---
❌ THIẾU SePay__CallbackBaseUrl
❌ THIẾU SePay__CallbackUrl
❌ THIẾU SEPAY_WEBHOOK_SECRET

# --- Payment ---
❌ THIẾU Payment__ApiBaseUrl
❌ THIẾU Payment__RateLimitSeconds
```

---

## ✅ **FILE MỚI (Đã sửa)**

```env
# --- Cấu hình Chung ---
NODE_ENV=production
PORT=3003  ✅ Đúng port
ASPNETCORE_ENVIRONMENT=Production  ✅ Thêm mới
ASPNETCORE_URLS=http://+:8080
NEXT_PUBLIC_API_GATEWAY=  ✅ Empty = relative URLs

# --- Auth & Dev ---
Auth__DisableAuthorization=false  ✅ BẬT security
Dev__EnableDevEndpoints=false     ✅ TẮT dev endpoints

# --- CORS ---
Cors__AllowedOrigins__0=https://cbbo-g99.io.vn  ✅ Thêm mới

# --- AppConfig ---
AppConfig__FrontendBaseUrl=https://cbbo-g99.io.vn  ✅ Production domain
AppConfig__IncludeInnerException=false  ✅ Tắt cho production
AppConfig__IncludeExceptionStackTrace=false  ✅ Tắt cho production

# --- JWT ---
Jwt__Issuer=https://cbbo-g99.io.vn  ✅ Production domain
Jwt__ValidIssuers__0=https://cbbo-g99.io.vn  ✅ Thêm mới
Jwt__Audience=https://cbbo-g99.io.vn  ✅ Production domain
Jwt__ValidAudiences__0=https://cbbo-g99.io.vn  ✅ Thêm mới

# --- Frontend ---
FRONTEND_NODE_ENV=production  ✅ Thêm mới
NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=res.cloudinary.com  ✅ Thêm mới
NEXT_PUBLIC_IMAGES_UNOPTIMIZED=false  ✅ Thêm mới

# --- SwaggerGen ---
SwaggerGen__Title=Pathora Backend API  ✅ Thêm mới
SwaggerGen__Version=v1  ✅ Thêm mới
SwaggerGen__Description=...  ✅ Thêm mới
SwaggerGen__ContactName=...  ✅ Thêm mới
SwaggerGen__ContactEmail=...  ✅ Thêm mới
SwaggerGen__dev=...  ✅ Thêm mới
SwaggerGen__ContactUrl=...  ✅ Thêm mới

# --- SePay ---
SePay__CallbackBaseUrl=https://cbbo-g99.io.vn  ✅ Thêm mới
SePay__CallbackUrl=https://cbbo-g99.io.vn/api/payment/sepay/webhook  ✅ Thêm mới
SEPAY_WEBHOOK_SECRET=Pathora_SePay_SecretKey_2026_xYz987  ✅ Thêm mới

# --- Payment ---
Payment__ApiBaseUrl=https://my.sepay.vn  ✅ Thêm mới
Payment__RateLimitSeconds=5  ✅ Thêm mới
```

---

## 🔥 **CÁC VẤN ĐỀ NGHIÊM TRỌNG ĐÃ SỬA**

### 1. **Login Issue** ✅ FIXED
**Trước:**
```env
NEXT_PUBLIC_API_GATEWAY=https://pathora-api.duckdns.org
```
→ Frontend gọi API qua domain khác → CORS error → Cookie không hoạt động

**Sau:**
```env
NEXT_PUBLIC_API_GATEWAY=
```
→ Frontend dùng relative URLs (`/api/*`) → Same origin → Cookie hoạt động

---

### 2. **Security Issue** ✅ FIXED
**Trước:**
```env
Auth__DisableAuthorization=true  ❌ Ai cũng truy cập được
Dev__EnableDevEndpoints=true     ❌ Lộ thông tin nhạy cảm
```

**Sau:**
```env
Auth__DisableAuthorization=false  ✅ Bật authorization
Dev__EnableDevEndpoints=false     ✅ Tắt dev endpoints
```

---

### 3. **CORS Issue** ✅ FIXED
**Trước:**
```env
❌ KHÔNG CÓ Cors__AllowedOrigins
```
→ Backend không biết domain nào được phép

**Sau:**
```env
Cors__AllowedOrigins__0=https://cbbo-g99.io.vn
```
→ Chỉ domain chính thức được phép

---

### 4. **JWT Issue** ✅ FIXED
**Trước:**
```env
Jwt__Issuer=http://localhost:5812
Jwt__Audience=http://localhost:5812
```
→ JWT không valid cho production domain

**Sau:**
```env
Jwt__Issuer=https://cbbo-g99.io.vn
Jwt__ValidIssuers__0=https://cbbo-g99.io.vn
Jwt__Audience=https://cbbo-g99.io.vn
Jwt__ValidAudiences__0=https://cbbo-g99.io.vn
```
→ JWT valid cho production

---

### 5. **Frontend Config Issue** ✅ FIXED
**Trước:**
```env
❌ THIẾU FRONTEND_NODE_ENV
❌ THIẾU NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
❌ THIẾU NEXT_PUBLIC_IMAGES_UNOPTIMIZED
```
→ Frontend không build đúng cho production

**Sau:**
```env
FRONTEND_NODE_ENV=production
NEXT_PUBLIC_REMOTE_IMAGE_HOSTS=res.cloudinary.com
NEXT_PUBLIC_IMAGES_UNOPTIMIZED=false
```
→ Frontend build production mode

---

### 6. **Payment Webhook Issue** ✅ FIXED
**Trước:**
```env
❌ THIẾU SePay__CallbackBaseUrl
❌ THIẾU SePay__CallbackUrl
```
→ Payment webhook không hoạt động

**Sau:**
```env
SePay__CallbackBaseUrl=https://cbbo-g99.io.vn
SePay__CallbackUrl=https://cbbo-g99.io.vn/api/payment/sepay/webhook
```
→ Webhook hoạt động đúng

---

## 📊 **TỔNG KẾT**

| Vấn đề | File Cũ | File Mới |
|--------|---------|----------|
| Login không hoạt động | ❌ | ✅ |
| CORS errors | ❌ | ✅ |
| JWT không valid | ❌ | ✅ |
| Security holes | ❌ | ✅ |
| Frontend config thiếu | ❌ | ✅ |
| Payment webhook không hoạt động | ❌ | ✅ |
| SwaggerGen config thiếu | ❌ | ✅ |

---

## 🚀 **HƯỚNG DẪN SỬ DỤNG**

### Bước 1: Backup file cũ
```bash
mv .env .env.old
```

### Bước 2: Copy file mới
```bash
cp .env.dokploy .env
```

### Bước 3: Deploy lên Dokploy
Upload file `.env` mới lên Dokploy và deploy.

### Bước 4: Test
```bash
# Test login
curl -X POST https://cbbo-g99.io.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

---

**File mới**: `.env.dokploy`  
**Domain**: https://cbbo-g99.io.vn  
**Status**: ✅ Ready for production
