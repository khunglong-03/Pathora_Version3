# 🚀 Vercel Deployment Setup - Pathora Frontend

## ⚠️ QUAN TRỌNG: Backend localhost không thể access từ Vercel

Vercel chạy trên cloud → **KHÔNG THỂ** gọi `http://localhost:5182` từ production.

Bạn CẦN expose backend ra internet bằng 1 trong 2 cách:

---

## 🔧 Cách 1: Sử dụng ngrok (KHUYẾN NGHỊ - NHANH NHẤT)

### Bước 1: Cài ngrok
```bash
# Download từ: https://ngrok.com/download
# Hoặc dùng chocolatey:
choco install ngrok
```

### Bước 2: Chạy backend local
```bash
cd D:\Doan2\panthora_be
dotnet run --project src/Api/Api.csproj
```

### Bước 3: Expose backend qua ngrok
```bash
ngrok http 5182
```

Bạn sẽ nhận được URL kiểu: `https://abc-123-xyz.ngrok-free.app`

### Bước 4: Dùng URL này trong Vercel Environment Variables

---

## 🔧 Cách 2: Cloudflare Tunnel (FREE, ỔN ĐỊNH HƠN)

### Bước 1: Cài Cloudflare Tunnel
```bash
# Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### Bước 2: Tạo tunnel
```bash
cloudflared tunnel --url http://localhost:5182
```

Nhận URL: `https://xyz.trycloudflare.com`

---

## 📋 VERCEL DEPLOYMENT SETUP

### 1. Root Directory Setting
Trong Vercel Dashboard → **Edit** Root Directory:
```
pathora/frontend
```

### 2. Build Settings (Vercel tự detect Next.js)
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (auto)
- **Output Directory:** `.next` (auto)
- **Install Command:** `npm ci` (auto)

### 3. Environment Variables

Click **Environment Variables** → Add:

| Name | Value | Note |
|------|-------|------|
| `NEXT_PUBLIC_API_GATEWAY` | `https://YOUR-NGROK-URL.ngrok-free.app` | URL từ ngrok/cloudflare |
| `NEXT_PUBLIC_IMAGES_UNOPTIMIZED` | `false` | Optional |

⚠️ **LƯU Ý:** Thay `YOUR-NGROK-URL` bằng URL thực tế từ ngrok/cloudflare

### 4. Deploy
Click **Deploy** button

---

## 🧪 TEST SAU KHI DEPLOY

1. Vercel sẽ deploy và cho bạn URL: `https://pathora-version3.vercel.app`
2. Mở URL đó
3. Login với: `admin@pathora.vn` / `thehieu03`
4. Test manager UI

---

## ❌ KHÔNG LÀM ĐƯỢC (sẽ fail):

```
NEXT_PUBLIC_API_GATEWAY=http://localhost:5182  ❌ 
```
→ Vercel chạy trên cloud, không access được localhost của bạn

---

## ✅ CẦN LÀM:

1. **Option A - Ngrok (test nhanh):**
   ```bash
   ngrok http 5182
   ```
   Copy URL: `https://abc-123.ngrok-free.app`
   
2. **Option B - Cloudflare Tunnel (production):**
   ```bash
   cloudflared tunnel --url http://localhost:5182
   ```
   Copy URL: `https://xyz.trycloudflare.com`

3. **Paste URL vào Vercel Environment Variables:**
   - Key: `NEXT_PUBLIC_API_GATEWAY`
   - Value: `https://abc-123.ngrok-free.app` (URL thực)

4. **Deploy**

---

## 🎯 TLDR (Quick Steps)

1. Chạy backend local: `dotnet run --project panthora_be/src/Api/Api.csproj`
2. Expose qua ngrok: `ngrok http 5182`
3. Copy ngrok URL
4. Vercel → Root Directory = `pathora/frontend`
5. Vercel → Environment Variables → Add `NEXT_PUBLIC_API_GATEWAY` = ngrok URL
6. Deploy

---

## 📞 Alternative: Deploy Backend lên Cloud

Nếu muốn stable hơn, deploy backend lên:
- Railway
- Fly.io
- Render
- Azure App Service
- AWS Elastic Beanstalk

Rồi dùng backend URL cloud trong Vercel env vars.
