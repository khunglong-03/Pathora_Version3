## Context

Trang `/tour-instances/create` có wizard 3 bước. Step 0 (`SelectTourStep`) cho phép user chọn Package Tour và Classification. Dropdown Package Tour gọi `GET /api/public/tours` — endpoint này chỉ trả về tours có `Status == Active`.

Khi không có tour Active nào, API trả `{ data: [], total: 0 }` — HTTP 200, không lỗi. Code hiện tại xử lý `loadError` (connection error) nhưng KHÔNG xử lý trường hợp API thành công nhưng trả mảng rỗng. Result: dropdown trống với placeholder mặc định, user không hiểu tại sao.

## Goals / Non-Goals

**Goals:**
- Hiển thị inline message bên dưới select khi không có tour Active nào
- Message có i18n support (en/vi)
- Không ảnh hưởng UI khi có tour để chọn

**Non-Goals:**
- Không thay đổi API/backend filter
- Không đổi sang admin endpoint
- Không thêm retry logic mới (chỉ dùng cơ chế reloadToken hiện có)

## Decisions

### Approach: Inline empty state message (Option 1)

**Quyết định:** Thêm thẻ `<p>` bên dưới `<select>` hiển thị message khi `tours.length === 0 && !loading && !loadError`.

```tsx
// Trong SelectTourStep, sau </select> ở dòng ~193
{tours.length === 0 && !loading && !loadError && (
  <p className="mt-2 text-sm text-stone-500 italic">
    {t("tourInstance.noActiveTours", "No active tours available. Please activate a tour in Tour Management to create instances.")}
  </p>
)}
```

**Tại sao không dùng `<option disabled>` bên trong select:**
- `<option>` không hỗ trợ style đa dòng hoặc icon tốt
- Không thể thêm warning icon (⚠️, 📭) vào option text một cách clean
- User vẫn phải interact với select để thấy message

**Alternatives considered:**
1. `<option disabled>` — chỉ hiện text ngắn, không style được, UX không rõ ràng
2. Warning/info box bên trên select — tốn không gian, phá vỡ layout flow của form
3. Disable select + thay đổi placeholder — UX không consistent với phần còn lại của form

### Approach 2: Thêm i18n key

Thêm vào 2 file locale:
- `src/i18n/locales/en/translation.json` — key: `tourInstance.noActiveTours`
- `src/i18n/locales/vi/translation.json` — key: `tourInstance.noActiveTours`

## Risks / Trade-offs

- **[Risk]** Nếu sau này API đổi response shape → cần cập nhật condition
  → **[Mitigation]** Condition chỉ check `tours.length === 0`, không phụ thuộc vào shape cụ thể
- **[Risk]** Text message quá dài gây layout shift
  → **[Mitigation]** Dùng `text-sm`, `mt-2` spacing nhất quán với error message bên trên
