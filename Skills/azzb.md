---
name: the-hieu-design
description: >-
  Chuẩn UI Pathora (public landing, tour discovery, checkout): khoảng cách, typography,
  trạng thái tương tác, responsive. Dùng khi implement frontend trong change private-custom-tour và trang marketing.
---

# The Hieu — Pathora frontend design guideline

Scope: **public** flows (`pathora/frontend`: tours, discovery, checkout, modals). Dashboard/manager có pallet riêng; ưu tiên nhất quán trong cùng một màn hình.

## 1. Spacing & layout

- **Scale**: nhịp 4 / 8 (`gap-4`, `gap-6`, `gap-8`, `p-4` … `p-8 md:p-10`). Tránh magic số lẻ trừ khi căn pixel cho alignment.
- **Page container**: `max-w-7xl` hoặc `max-w-[1320px]` (checkout) + `mx-auto` + `px-4 md:px-6 lg:px-8`.
- **Sections**: `py-8 md:py-10` hoặc tương đương; section lớn thêm `min-h` chỉ khi cần, ưu tiên `min-h-[100dvh]` thay cho `h-screen` cho hero/full-page.
- **Cards / panels**: bo góc `rounded-[1.5rem]` đến `rounded-[2.5rem]`; viền `border-slate-200/50` hoặc `border-slate-100`; bóng nhẹ `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]` (đồng bộ checkout summary / sidebar).

## 2. Typography

- **Display / H1**: `text-4xl md:text-5xl` (hoặc lớn hơn một bậc nếu hero), `font-bold`, `tracking-tighter`, `text-slate-900`, `leading-none` hoặc `leading-tight`.
- **H2 / section**: `text-xl`–`text-2xl`, `font-semibold`, `tracking-tight`.
- **Body / support**: `text-sm`–`text-base`, `text-slate-500` hoặc `text-slate-600`, `leading-relaxed`. Đoạn giải thích dài: `max-w-[65ch]` khi đi kèm heading.
- **Uppercase labels**: `text-[11px] font-bold uppercase tracking-wider text-slate-400` (filter, meta).
- **Số tiền**: `tabular-nums`; currency dùng helper `fmtCurrency` / pattern hiện có.

## 3. Color (Pathora public)

- **Neutrals**: nền `bg-[#f9fafb]` / `#F8F8F6` (landing); text chính `slate-900`; phụ `slate-500` / `slate-400`.
- **Accent**: cam Pathora `#fa8b02` cho CTA chính trên discovery / filter; checkout có thể dùng `zinc-950` cho nút primary — **giữ một accent thống trị trên một view**, không thêm gradient “AI purple”.
- **Semantic**: thành công `emerald-600` / `green-600` / nền `green-50`; lỗi `red-500` / nền `red-50`; cảnh báo `amber-50` / `orange-50` (countdown thanh toán).

## 4. Interaction states

- **Primary button (enabled)**: `hover:` sáng/nền đậm hơn một bậc; `active:` `scale-[0.98]` hoặc `-translate-y-0.5` nhẹ; `transition` rõ ràng; `focus-visible:outline` + `outline-offset-2` (ring tương thích `#fa8b02` hoặc `slate-900` tùy màn).
- **Disabled**: `cursor-not-allowed`, `bg-slate-100`, `text-slate-400`, không animation hover.
- **Loading**: spinner + nhãn `processing` / verifying; nút giữ layout cố định, tránh nhảy chiều cao.
- **Modal**: lớp phủ `bg-slate-900/50` + `backdrop-blur` nhẹ; panel `rounded-[1.5rem]`; đóng bằng overlay + nút; `role="dialog"` + `aria-labelledby` khi có title.

## 5. Responsive

- **Mobile**: một cột; tap target tối thiểu ~44px; filter phụ dùng drawer; không ẩn thông tin thanh toán bắt buộc sau scroll mà không có sticky hint.
- **Tablet / desktop**: `md:` / `lg:` / `xl:` — sidebar checkout `xl:sticky xl:top-8`; grid tour `grid-cols-1` → `md:grid-cols-2`.
- **Không** dùng flex `%` phức tạp cho grid card; ưu tiên `grid` + `gap-*`.

## 6. Acceptance checklist (trước khi merge UI)

- [ ] Spacing và bo góc đồng bộ với các card cùng trang.
- [ ] Typography phân cấp rõ (H1 → support text).
- [ ] Trạng thái disabled / loading / error / success đều có mặt và dễ đọc.
- [ ] Layout ổn 320px-wide và `xl` hai cột không vỡ.
- [ ] Focus keyboard thấy được; dialog có label.

## 7. Tham chiếu thêm

Chi tiết kỹ thuật sâu (motion, chống “AI slop”): `.agents/skills/design-taste-frontend/SKILL.md` — dùng bổ sung, không thay các quy tắc Pathora ở trên.
