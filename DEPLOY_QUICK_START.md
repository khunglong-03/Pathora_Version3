# 🚀 Quick Start - Deploy Pathora lên Dokploy

## 📦 Files Cần Upload

1. **`.env.production`** → đổi tên thành **`.env`**
2. **`docker-compose.production.yml`** → đổi tên thành **`docker-compose.yml`**
3. **`nginx/default.conf`** (giữ nguyên)
4. **Toàn bộ source code**

## ⚙️ Cấu Hình Dokploy

### 1. Tạo Project Mới

- Project Name: `pathora`
- Type: Docker Compose
- Repository: Upload hoặc Git

### 2. Environment Variables

Copy toàn bộ nội dung từ `.env.production` vào Dokploy Environment Variables.

**Hoặc chỉ cần set những biến quan trọng:**

```env
# Critical
ASPNETCORE_ENVIRONMENT=Production
Auth__DisableAuthorization=false
Dev__EnableDevEndpoints=false

# Domain
Cors__AllowedOrigins__0=https://cbbo-g99.io.vn
AppConfig__FrontendBaseUrl=https://cbbo-g99.io.vn

# Database
ConnectionStrings__Default=Host=172.17.0.1;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable;Pooling=true;MinPoolSize=2;MaxPoolSize=30

# Redis
Redis__ConnectionString=redis-pathora:6379,password=G67_Pathora_Redis,abortConnect=False

# Frontend
NEXT_PUBLIC_API_GATEWAY=
FRONTEND_NODE_ENV=production
```

### 3. Domain & SSL

1. Add domain: `cbbo-g99.io.vn`
2. Enable SSL/TLS (Let's Encrypt)
3. Dokploy tự động handle HTTPS

### 4. Deploy

Click **Deploy** button trong Dokploy.

## ✅ Verify Deployment

### Test Endpoints

```bash
# Frontend
curl https://cbbo-g99.io.vn

# Health checks
curl https://cbbo-g99.io.vn/health/api
curl https://cbbo-g99.io.vn/health/public

# Login API
curl -X POST https://cbbo-g99.io.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Check Containers

```bash
docker ps
```

Expected:
```
pathora-backend     Up (healthy)
pathora-publicapi   Up (healthy)
pathora-frontend    Up (healthy)
pathora-nginx       Up (healthy)
```

## 🔍 Troubleshooting

### Login không hoạt động?

1. Check `NEXT_PUBLIC_API_GATEWAY` phải **empty** (không có giá trị)
2. Check `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`
3. Check browser cookies (DevTools → Application → Cookies)

### 404 Not Found?

1. Check nginx logs: `docker logs pathora-nginx`
2. Verify `nginx/default.conf` đã mount đúng
3. Restart nginx: `docker restart pathora-nginx`

### CORS errors?

1. Check `Cors__AllowedOrigins__0` trong environment variables
2. Phải là `https://cbbo-g99.io.vn` (không có trailing slash)
3. Restart backend: `docker restart pathora-backend pathora-publicapi`

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

## 🔐 Security Checklist

- [x] `Auth__DisableAuthorization=false`
- [x] `Dev__EnableDevEndpoints=false`
- [x] `ASPNETCORE_ENVIRONMENT=Production`
- [x] SSL/TLS enabled
- [x] CORS chỉ allow domain chính thức
- [x] Frontend không expose port 3003

## 📝 Important Notes

1. **Single Domain**: Tất cả traffic qua `https://cbbo-g99.io.vn`
2. **No Port Exposure**: Frontend không expose port, chỉ nginx expose port 80
3. **Relative URLs**: Frontend dùng `/api/*` thay vì `http://localhost/api/*`
4. **Cookies Work**: Same-origin → cookies hoạt động bình thường
5. **SSL Termination**: Dokploy handle SSL, containers dùng HTTP internally

## 🆘 Need Help?

Check logs:
```bash
docker logs pathora-frontend
docker logs pathora-backend
docker logs pathora-publicapi
docker logs pathora-nginx
```

---

**Domain**: https://cbbo-g99.io.vn  
**Architecture**: Nginx → Frontend + Backend APIs  
**Deploy Platform**: Dokploy
