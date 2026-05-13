# ✅ Checklist Deploy Pathora lên Dokploy

## 📦 **Files Cần Upload**

- [ ] `.env.dokploy` → đổi tên thành `.env`
- [ ] `docker-compose.production.yml` → đổi tên thành `docker-compose.yml`
- [ ] `nginx/default.conf` (giữ nguyên)
- [ ] Toàn bộ source code

---

## ⚙️ **Cấu Hình Dokploy**

### 1. Project Setup
- [ ] Tạo project mới: **pathora**
- [ ] Type: **Docker Compose**
- [ ] Upload source code hoặc connect Git

### 2. Environment Variables
- [ ] Copy toàn bộ nội dung từ `.env.dokploy`
- [ ] Paste vào Dokploy Environment Variables
- [ ] **HOẶC** upload file `.env` trực tiếp

### 3. Domain & SSL
- [ ] Add domain: **cbbo-g99.io.vn**
- [ ] Enable **SSL/TLS** (Let's Encrypt)
- [ ] Point DNS A record to Dokploy server IP

---

## 🔍 **Verify Configuration**

### Critical Settings Check

- [ ] `ASPNETCORE_ENVIRONMENT=Production`
- [ ] `Auth__DisableAuthorization=false` ⚠️ MUST be false
- [ ] `Dev__EnableDevEndpoints=false` ⚠️ MUST be false
- [ ] `NEXT_PUBLIC_API_GATEWAY=` ⚠️ MUST be empty
- [ ] `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`
- [ ] `AppConfig__FrontendBaseUrl=https://cbbo-g99.io.vn`
- [ ] `Jwt__Issuer=https://cbbo-g99.io.vn`
- [ ] `Jwt__Audience=https://cbbo-g99.io.vn`

---

## 🚀 **Deploy**

- [ ] Click **Deploy** button trong Dokploy
- [ ] Đợi build hoàn thành (5-10 phút)
- [ ] Check container status: All **healthy**

---

## ✅ **Post-Deploy Testing**

### 1. Health Checks
```bash
# Frontend
curl https://cbbo-g99.io.vn
# Expected: HTML response

# Backend health
curl https://cbbo-g99.io.vn/health/api
# Expected: {"status":"Healthy"}

# PublicApi health
curl https://cbbo-g99.io.vn/health/public
# Expected: {"status":"Healthy"}
```

- [ ] Frontend health check passed
- [ ] Backend health check passed
- [ ] PublicApi health check passed

### 2. Login Test
```bash
curl -X POST https://cbbo-g99.io.vn/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

- [ ] Login API returns 200 OK
- [ ] Response contains `accessToken` and `refreshToken`
- [ ] Cookies are set in response headers

### 3. Browser Test
1. Open `https://cbbo-g99.io.vn` in browser
2. Try to login
3. Check DevTools → Application → Cookies

- [ ] Website loads correctly
- [ ] Login form works
- [ ] Cookies are saved after login
- [ ] No CORS errors in console
- [ ] No 404 errors for API calls

### 4. Public API Test
```bash
# Get public tours
curl https://cbbo-g99.io.vn/api/public/tours

# Get tax rate
curl https://cbbo-g99.io.vn/api/tax-configs/active-rate
```

- [ ] Public tours API works
- [ ] Tax rate API works
- [ ] No authentication required

---

## 🔍 **Troubleshooting**

### Issue: Login không hoạt động

**Check:**
- [ ] `NEXT_PUBLIC_API_GATEWAY` phải empty
- [ ] `Cors__AllowedOrigins__0=https://cbbo-g99.io.vn`
- [ ] Browser cookies (DevTools → Application → Cookies)
- [ ] Backend logs: `docker logs pathora-backend`

**Fix:**
```bash
# Restart containers
docker restart pathora-backend pathora-publicapi pathora-frontend
```

---

### Issue: 404 Not Found cho API calls

**Check:**
- [ ] Nginx config đã mount đúng
- [ ] Nginx logs: `docker logs pathora-nginx`
- [ ] API endpoint đúng format: `/api/auth/login`

**Fix:**
```bash
# Restart nginx
docker restart pathora-nginx
```

---

### Issue: CORS errors

**Check:**
- [ ] `Cors__AllowedOrigins__0` trong environment variables
- [ ] Domain không có trailing slash
- [ ] Backend logs: `docker logs pathora-backend`

**Fix:**
```bash
# Update environment variable
Cors__AllowedOrigins__0=https://cbbo-g99.io.vn

# Restart backend
docker restart pathora-backend pathora-publicapi
```

---

### Issue: Containers không healthy

**Check:**
```bash
# Check container status
docker ps

# Check logs
docker logs pathora-backend
docker logs pathora-publicapi
docker logs pathora-frontend
docker logs pathora-nginx
```

**Common causes:**
- [ ] Database connection failed → Check `ConnectionStrings__Default`
- [ ] Redis connection failed → Check `Redis__ConnectionString`
- [ ] Port conflict → Check no other services using ports 80, 8080, 8081, 3003

---

## 📊 **Monitoring**

### Container Status
```bash
docker ps
```

Expected output:
```
NAME                 STATUS              PORTS
pathora-frontend     Up (healthy)        3003/tcp
pathora-backend      Up (healthy)        8080/tcp
pathora-publicapi    Up (healthy)        8081/tcp
pathora-nginx        Up (healthy)        0.0.0.0:80->80/tcp
```

- [ ] All containers are **Up**
- [ ] All containers are **(healthy)**

### Logs Monitoring
```bash
# Watch all logs
docker-compose logs -f

# Watch specific service
docker logs -f pathora-backend
```

- [ ] No error messages in logs
- [ ] No warning messages about missing config

---

## 🔐 **Security Final Check**

- [ ] `Auth__DisableAuthorization=false` ✅
- [ ] `Dev__EnableDevEndpoints=false` ✅
- [ ] `ASPNETCORE_ENVIRONMENT=Production` ✅
- [ ] SSL/TLS enabled ✅
- [ ] Database password strong ✅
- [ ] Redis password strong ✅
- [ ] JWT Secret changed from default ✅
- [ ] CORS only allows production domain ✅
- [ ] Frontend doesn't expose port 3003 ✅
- [ ] `AppConfig__IncludeInnerException=false` ✅
- [ ] `AppConfig__IncludeExceptionStackTrace=false` ✅

---

## 📝 **Final Notes**

### Architecture
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

### Key Points
1. **Single Domain**: Tất cả traffic qua `https://cbbo-g99.io.vn`
2. **No Port Exposure**: Frontend không expose port 3003
3. **Relative URLs**: Frontend dùng `/api/*` thay vì absolute URLs
4. **Cookies Work**: Same-origin → cookies hoạt động
5. **SSL Termination**: Dokploy handle SSL, containers dùng HTTP

---

## ✅ **Deployment Complete**

- [ ] All health checks passed
- [ ] Login works correctly
- [ ] Public APIs work
- [ ] No errors in logs
- [ ] Security settings correct
- [ ] Monitoring setup

**Status**: 🎉 **READY FOR PRODUCTION**

---

**Domain**: https://cbbo-g99.io.vn  
**Deploy Date**: _____________  
**Deployed By**: _____________
