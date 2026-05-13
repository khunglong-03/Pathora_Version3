# 🔧 Fix Container Name Conflict

## ❌ Lỗi

```
Error response from daemon: Conflict. The container name "/pathora-backend" is already in use
```

## ✅ Giải Pháp

### **Option 1: Cleanup Containers Cũ (RECOMMENDED)**

#### Windows (PowerShell):
```powershell
.\cleanup-old-containers.ps1
```

#### Linux/Mac:
```bash
chmod +x cleanup-old-containers.sh
./cleanup-old-containers.sh
```

#### Manual Cleanup:
```bash
# Stop old containers
docker stop pathora-backend pathora-publicapi pathora-frontend pathora-nginx

# Remove old containers
docker rm pathora-backend pathora-publicapi pathora-frontend pathora-nginx

# Remove old images (optional)
docker rmi pathora-stack-backend pathora-stack-publicapi pathora-stack-frontend

# Check
docker ps -a | grep pathora
```

---

### **Option 2: Dùng File Mới (ĐÃ SỬA)**

File `docker-compose.production.yml` đã được update với tên containers mới:

```yaml
backend:
  container_name: pathora-backend-v2  ✅

publicapi:
  container_name: pathora-publicapi-v2  ✅

frontend:
  container_name: pathora-frontend-v2  ✅

nginx:
  container_name: pathora-nginx-v2  ✅
```

**Deploy lại:**
```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔍 Kiểm Tra

### Check containers đang chạy:
```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS              NAMES
xxx            pathora-backend-v2       Up (healthy)        pathora-backend-v2
xxx            pathora-publicapi-v2     Up (healthy)        pathora-publicapi-v2
xxx            pathora-frontend-v2      Up (healthy)        pathora-frontend-v2
xxx            nginx:1.27-alpine        Up (healthy)        pathora-nginx-v2
```

### Check containers cũ:
```bash
docker ps -a | grep pathora
```

Nếu vẫn thấy containers cũ (pathora-backend, pathora-publicapi...):
```bash
# Remove chúng
docker rm -f pathora-backend pathora-publicapi pathora-frontend pathora-nginx
```

---

## 📝 Notes

### Tại sao lỗi này xảy ra?

1. **Containers cũ vẫn tồn tại**: Dokploy hoặc Docker đã tạo containers với tên cũ
2. **Docker không cho phép trùng tên**: Mỗi container phải có tên unique
3. **Solution**: Remove containers cũ HOẶC đổi tên containers mới

### Containers mới vs cũ

| Old Name | New Name |
|----------|----------|
| `pathora-backend` | `pathora-backend-v2` |
| `pathora-publicapi` | `pathora-publicapi-v2` |
| `pathora-frontend` | `pathora-frontend-v2` |
| `pathora-nginx` | `pathora-nginx-v2` |

### Cleanup an toàn?

✅ **An toàn**:
- Stop containers
- Remove containers
- Remove images

⚠️ **Cẩn thận**:
- Remove volumes (có thể mất data)

❌ **Không nên**:
- `docker system prune -a` (xóa tất cả)

---

## 🚀 Deploy Lại

Sau khi cleanup:

```bash
# Option 1: Dùng docker-compose
docker-compose -f docker-compose.production.yml up -d

# Option 2: Dùng Dokploy
# Click "Redeploy" button trong Dokploy dashboard
```

---

## ✅ Verify

```bash
# Check containers
docker ps

# Check logs
docker logs pathora-backend-v2
docker logs pathora-publicapi-v2
docker logs pathora-frontend-v2
docker logs pathora-nginx-v2

# Test endpoints
curl https://cbbo-g99.io.vn
curl https://cbbo-g99.io.vn/health/api
```

---

**Status**: ✅ Fixed  
**New Containers**: `pathora-*-v2`  
**Old Containers**: Removed
