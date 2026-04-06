## 1. Environment Config

- [x] 1.1 Create `pathora/frontend/.env.local` with `NEXT_PUBLIC_API_GATEWAY=http://localhost:5812`
- [x] 1.2 Update `pathora/frontend/.env.local.example` port from `5182` to `5812`

## 2. Verification

- [ ] 2.1 Restart frontend dev server (`npm run dev`)
- [ ] 2.2 Open `http://localhost:3001/home` (or your frontend port)
- [ ] 2.3 Verify no `ERR_NETWORK` errors in browser console
- [ ] 2.4 Confirm home page data (stats, tours, reviews) loads correctly
