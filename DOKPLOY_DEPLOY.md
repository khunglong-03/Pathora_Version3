# Hướng Dẫn Deploy Pathora lên Dokploy

## 📋 Tổng Quan

- **Domain**: `https://cbbo-g99.io.vn`
- **Architecture**: Nginx → Frontend + Backend APIs
- **Services**: 
  - Frontend (Next.js) - port 3003 (internal)
  - Backend API - port 8080 (internal)
  - PublicApi - port 8081 (internal)
  - Nginx - port 80/443 (public)

## 🔧 Cấu Hình Dokploy

### 1. Upload Files

Upload các files sau lên server:
- `.env.production` → đổi tên thành `.env`
- `docker-compose.yml`
- `nginx/default.conf`
- Toàn bộ source code

### 2. Cấu Hình Environment Variables trong Dokploy

Trong Dokploy dashboard, set các biến môi trường từ file `.env.production`:

**Critical Settings:**
```env
ASPNETCORE_ENVIRONMENT=Production
Auth__DisableAuthorization=false
Dev__EnableDevEndpoints=false

Cors__AllowedOrigins__0=https://cbbo-g99.io.vn
AppConfig__FrontendBaseUrl=https://cbbo-g99.io.vn

ConnectionStrings__Default=Host=172.17.0.1;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable;Pooling=true;MinPoolSize=2;MaxPoolSize=30
Redis__ConnectionString=redis-pathora:6379,password=G67_Pathora_Redis,abortConnect=False

NEXT_PUBLIC_API_GATEWAY=
FRONTEND_NODE_ENV=production
```

### 3. Cấu Hình Docker Compose

File `docker-compose.yml` đã được cấu hình sẵn với:

**Frontend:**
- Không expose port 3003 ra ngoài
- Chỉ nginx mới truy cập được
- `NEXT_PUBLIC_API_GATEWAY=` (empty = relative URLs)

**Nginx:**
- Expose port 80 (Dokploy sẽ handle SSL)
- Routing tất cả requests
- Depends on frontend, backend, publicapi

### 4. Nginx Configuration

File `nginx/default.conf` routing:

```
/ → Frontend (Next.js)
/api/auth/* → PublicApi (login, register, public endpoints)
/api/public/* → PublicApi (public tours, policies...)
/api/customer/* → Backend (private customer APIs)
/api/* → Backend (catch-all for other APIs)
```

## 🚀 Deploy Steps

### Step 1: Chuẩn Bị Database & Redis

Đảm bảo PostgreSQL và Redis đang chạy:

```bash
# Check PostgreSQL
psql -h 172.17.0.1 -U postgres -d PPPPathora

# Check Redis
redis-cli -h redis-pathora -p 6379 -a G67_Pathora_Redis ping
```

### Step 2: Build & Deploy trong Dokploy

1. **Tạo Project mới** trong Dokploy
2. **Upload source code** hoặc connect Git repository
3. **Set environment variables** từ `.env.production`
4. **Deploy** với docker-compose

### Step 3: Cấu Hình SSL trong Dokploy

1. Vào **Settings** → **Domains**
2. Add domain: `cbbo-g99.io.vn`
3. Enable **SSL/TLS** (Let's Encrypt)
4. Dokploy sẽ tự động handle HTTPS

### Step 4: Verify Deployment

Sau khi deploy xong, test các endpoints:

```bash
# Test frontend
curl https://cbbo-g99.io.vn

# Test health checks
curl https://cbbo-g99.io.vn/health/api
curl https://cbbo-g99.io.vn/health/public

# Test login API
curl -X POST https://cbbo-g99.io.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🔍 Troubleshooting

### Issue 1: Login không hoạt động

**Nguyên nhân**: Cookie domain mismatch

**Giải pháp**:
- Kiểm tra `NEXT_PUBLIC_API_GATEWAY` phải empty
- Kiểm tra `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`
- Kiểm tra browser DevTools → Application → Cookies

### Issue 2: 404 Not Found cho API calls

**Nguyên nhân**: Nginx routing sai

**Giải pháp**:
- Kiểm tra `nginx/default.conf` đã mount đúng chưa
- Restart nginx container: `docker-compose restart nginx`
- Check nginx logs: `docker-compose logs nginx`

### Issue 3: CORS errors

**Nguyên nhân**: CORS không được cấu hình đúng

**Giải pháp**:
- Kiểm tra `Cors__AllowedOrigins__0` trong `.env`
- Phải là `https://cbbo-g99.io.vn` (không có trailing slash)
- Restart backend containers

### Issue 4: Database connection failed

**Nguyên nhân**: Database không accessible từ Docker network

**Giải pháp**:
- Kiểm tra `ConnectionStrings__Default`
- Host `172.17.0.1` là Docker host IP
- Nếu dùng external DB, thay đổi host IP
- Check PostgreSQL allows connections from Docker network

## 📊 Monitoring

### Check Container Status

```bash
docker-compose ps
```

Expected output:
```
NAME                 STATUS              PORTS
pathora-frontend     Up (healthy)        3003/tcp
pathora-backend      Up (healthy)        8080/tcp
pathora-publicapi    Up (healthy)        8081/tcp
pathora-nginx        Up (healthy)        0.0.0.0:80->80/tcp
```

### Check Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f publicapi
docker-compose logs -f nginx
```

### Health Checks

```bash
# Backend health
curl https://cbbo-g99.io.vn/health/api

# PublicApi health
curl https://cbbo-g99.io.vn/health/public

# Frontend health (through nginx)
curl https://cbbo-g99.io.vn
```

## 🔐 Security Checklist

- [ ] `Auth__DisableAuthorization=false` (MUST be false in production)
- [ ] `Dev__EnableDevEndpoints=false` (MUST be false in production)
- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] SSL/TLS enabled trong Dokploy
- [ ] Database password strong
- [ ] Redis password strong
- [ ] JWT Secret changed from default
- [ ] Google OAuth credentials configured
- [ ] CORS chỉ allow domain chính thức

## 📝 Notes

1. **Single Domain Architecture**: Tất cả traffic đi qua `https://cbbo-g99.io.vn`
2. **No Port Exposure**: Frontend không expose port 3003, chỉ nginx expose port 80
3. **Relative URLs**: Frontend dùng relative URLs (`/api/*`) thay vì absolute URLs
4. **Cookie Security**: Cookies work vì same-origin (cùng domain)
5. **SSL Termination**: Dokploy handle SSL, containers dùng HTTP internally

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose logs -f [service-name]`
2. Check health endpoints
3. Verify environment variables
4. Check nginx routing configuration
5. Test API endpoints với curl

---

**Last Updated**: 2026-05-14
**Domain**: https://cbbo-g99.io.vn
**Architecture**: Nginx → Frontend + Backend APIs
