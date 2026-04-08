# ✅ VERCEL DEPLOYMENT CHECKLIST

## 🚨 LỖI 404 NOT_FOUND - FIX NGAY

Lỗi này xảy ra vì **Root Directory** trong Vercel chưa được cấu hình đúng.

---

## 📋 BƯỚC 1: CẤU HÌNH ROOT DIRECTORY

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project **pathora-version3** (hoặc tên project của bạn)
3. Click tab **Settings** (⚙️)
4. Tìm phần **"Root Directory"**
5. Click **Edit**
6. Nhập: `pathora/frontend`
7. Click **Save**

### ❌ SAI (hiện tại):
```
Root Directory: ./   hoặc (empty)
```

### ✅ ĐÚNG:
```
Root Directory: pathora/frontend
```

---

## 📋 BƯỚC 2: CẤU HÌNH ENVIRONMENT VARIABLES

Vẫn trong **Settings** tab → tìm **Environment Variables** section → Click **Add**

### ⚠️ BẮT BUỘC - Variable 1: Backend API URL

```
Name:  NEXT_PUBLIC_API_GATEWAY
Value: https://YOUR-BACKEND-URL.ngrok-free.app
```

**3 OPTIONS cho backend URL:**

#### 🔥 Option A: Ngrok (TEST - NHANH NHẤT)
```bash
# Terminal 1: Chạy backend
cd D:\Doan2\panthora_be
dotnet run --project src/Api/Api.csproj

# Terminal 2: Expose qua ngrok
ngrok http 5182
```
Copy URL kiểu: `https://abc-123-xyz.ngrok-free.app`

**Nhược điểm:** URL thay đổi mỗi lần restart

---

#### ⭐ Option B: Ngrok với Custom Domain (STABLE)
```bash
# Cần tài khoản ngrok Pro
ngrok http 5182 --domain=pathora-api.ngrok.app
```
URL cố định: `https://pathora-api.ngrok.app`

---

#### 🚀 Option C: Deploy Backend lên Cloud (PRODUCTION READY)

Deploy backend lên một trong các nền tảng:
- **Railway** → Easiest for .NET
- **Fly.io** → Good for containers
- **Render** → Free tier available
- **Azure App Service** → Best for .NET
- **AWS Elastic Beanstalk**

Sau khi deploy xong, dùng URL cloud làm `NEXT_PUBLIC_API_GATEWAY`

---

### ⚠️ BẮT BUỘC - Variable 2: Image Hosts

```
Name:  NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
Value: cdn3.ivivu.com,images.unsplash.com,res.cloudinary.com,statics.vinpearl.com,travelhalong.com.vn,encrypted-tbn0.gstatic.com
```

**Copy chính xác value này** ↑ (Next.js security requirement)

---

### 📸 Variable 3 (Optional): Image Optimization

```
Name:  NEXT_PUBLIC_IMAGES_UNOPTIMIZED
Value: false
```

---

## 📋 BƯỚC 3: REDEPLOY

1. Sau khi đã set Root Directory + Environment Variables
2. Quay lại tab **Deployments**
3. Click vào deployment mới nhất
4. Click nút **"Redeploy"** (⟳)
5. Chờ 2-3 phút cho build complete

---

## 📋 BƯỚC 4: VERIFY DEPLOYMENT

### ✅ Build Success Indicators:
- Build logs không có lỗi
- Output: "Build completed successfully"
- Status: ✓ Ready

### 🧪 Testing:
1. Mở Vercel URL: `https://thehieu03.vercel.app`
2. Kiểm tra page load (không còn 404)
3. Login: `admin@pathora.vn` / `thehieu03`
4. Test manager UI

---

## 🎯 QUICK COPY-PASTE VALUES

### Root Directory
```
pathora/frontend
```

### Environment Variable 1
```
Name:  NEXT_PUBLIC_API_GATEWAY
Value: [PASTE YOUR NGROK URL OR CLOUD BACKEND URL]
```

### Environment Variable 2
```
Name:  NEXT_PUBLIC_REMOTE_IMAGE_HOSTS
Value: cdn3.ivivu.com,images.unsplash.com,res.cloudinary.com,statics.vinpearl.com,travelhalong.com.vn,encrypted-tbn0.gstatic.com
```

---

## 🐛 TROUBLESHOOTING

### Vẫn còn 404 sau khi set Root Directory?
- Clear Vercel cache: Settings → scroll down → "Clear Cache" → Redeploy
- Kiểm tra file `pathora/frontend/package.json` có `"build": "next build"` script

### Build fail với lỗi "Cannot find module"?
- Root Directory phải là `pathora/frontend` chứ KHÔNG phải `pathora` hay `frontend`

### API calls fail với CORS error?
- Backend cần enable CORS cho Vercel domain
- Kiểm tra `NEXT_PUBLIC_API_GATEWAY` có đúng URL và có https://

### Ngrok URL không hoạt động?
- Kiểm tra ngrok process vẫn đang chạy
- Kiểm tra backend vẫn đang chạy trên port 5182
- Free tier ngrok URL thay đổi mỗi lần restart

---

## 📊 VERIFICATION CHECKLIST

- [ ] Root Directory = `pathora/frontend` ✓
- [ ] `NEXT_PUBLIC_API_GATEWAY` = valid public URL (not localhost) ✓
- [ ] `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS` = correct value ✓
- [ ] Backend đang chạy và accessible qua URL ✓
- [ ] Redeploy completed successfully ✓
- [ ] Vercel URL mở được và không còn 404 ✓
- [ ] Login page hiển thị đúng ✓
- [ ] API calls hoạt động ✓

---

## 💡 PRO TIPS

1. **Ngrok cho development:** Dễ setup, URL thay đổi
2. **Cloudflare Tunnel cho staging:** Free, stable hơn ngrok
3. **Cloud deployment cho production:** Railway/Azure/AWS

4. **Git workflow:**
   ```bash
   # Sau mỗi code change:
   git add .
   git commit -m "Update feature X"
   git push origin main
   # Vercel auto-redeploy
   ```

5. **Environment-specific configs:**
   - `.env.local` → Local development
   - `.env.production` → Vercel reads this
   - Vercel Dashboard env vars → Override production defaults

---

## 🆘 STILL STUCK?

Check Vercel build logs:
1. Vercel Dashboard → Deployments
2. Click failed deployment
3. Click "View Function Logs" or "View Build Logs"
4. Copy error message

Common errors:
- `Cannot find module '@/...'` → Root Directory wrong
- `ENOENT: no such file or directory` → Root Directory wrong  
- `404 NOT_FOUND` → Root Directory not set or wrong
- Build success but runtime 404 → Framework detection issue (should be Next.js)

---

**Last Updated:** 2026-04-08
