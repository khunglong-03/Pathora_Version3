## Why

Frontend đang có **3 critical bugs** gây silent failure trong auth flow, và **7 auth endpoints** đã implement ở backend nhưng chưa được expose lên frontend service layer. Không fix thì các trang như forgot-password, reset-password, settings profile sẽ không hoạt động, và update profile user đang gửi sai format body.

## What Changes

### Bug Fixes

1. **Fix `UpdateMyProfile` body wrapper** — Frontend gửi `{ request: { fullName, phoneNumber, ... } }` nhưng backend `UpdateMyProfileCommand` expect flat body `{ fullName, phoneNumber, ... }`. Sửa frontend để gửi flat body.

2. **Fix `refreshToken` mutation body** — RTK Query `refreshToken` gửi `{ refreshToken: string }` trong body nhưng backend đọc từ HttpOnly cookie. Hai cơ chế refresh (`responseInterceptor.ts` và `authApiSlice.ts`) hoạt động nhưng không nhất quán. Chuẩn hóa cả hai dùng cookie-only approach.

3. **Fix `createBooking` return type** — `createBooking()` trả về `CheckoutPriceResponse` nhưng backend trả về booking result object. Sửa return type về đúng.

### Auth Endpoints

4. **Thêm 7 endpoint constants** vào `AUTH` endpoints và tạo service methods:
   - `POST /api/auth/change-password` — đổi password (cần old + new)
   - `POST /api/auth/forgot-password` — gửi email reset link
   - `POST /api/auth/reset-password` — reset password bằng token
   - `POST /api/auth/confirm-register` — confirm email đăng ký
   - `POST /api/auth/logout-all` — logout tất cả sessions
   - `GET /api/auth/me/settings` — lấy user settings (language, preferences)
   - `PUT /api/auth/me/settings` — cập nhật user settings
   - `GET /api/auth/google-callback` — OAuth callback

## Capabilities

### New Capabilities

- `auth-password-management`: Quản lý forgot/reset/change password flow
- `auth-registration-confirmation`: Email confirmation sau registration
- `auth-session-management`: Multi-session logout (logout-all)
- `auth-user-settings`: Lấy và cập nhật user preferences (language, etc.)

### Modified Capabilities

- `user-auth`: Bug fix — UpdateMyProfile body format, refreshToken cookie-only standardization
- `booking`: Bug fix — createBooking return type

## Impact

### Backend (panthora_be)

- Không thay đổi — tất cả endpoints đã implement

### Frontend (pathora/frontend)

| File | Thay đổi |
|------|----------|
| `src/api/endpoints/auth.ts` | Thêm 7 endpoint constants |
| `src/store/api/auth/authApiSlice.ts` | Fix body format, chuẩn hóa refresh |
| `src/api/services/authService.ts` (hoặc inline) | Thêm 7 service methods |
| `src/api/services/bookingService.ts` | Sửa return type createBooking |

### Breaking Changes

- **Không có breaking changes** — chỉ sửa bugs và thêm missing endpoints
