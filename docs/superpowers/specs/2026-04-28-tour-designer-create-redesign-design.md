# Spec: Tái thiết kế màn hình tạo Tour (Tour Designer Create Redesign)

> **Trạng thái:** Chờ phê duyệt
> **Ngày tạo:** 2026-04-28
> **Người thực hiện:** Gemini CLI (Vanguard_UI_Architect)

## 1. Tầm nhìn & Mục tiêu (Vision & Goals)

Tái cấu trúc màn hình tạo Tour tại `/tour-designer/tours/create` từ một dashboard chức năng thông thường thành một trải nghiệm "Cinematic" cao cấp. Mục tiêu là tạo ra sự khác biệt về mặt thị giác (Awwwards-tier), tối ưu hóa trải nghiệm người dùng thông qua bố cục phân tách (Editorial Split) và các tương tác vật lý (Haptic micro-interactions).

## 2. Ngôn ngữ thiết kế (Design Language)

- **Vibe:** Ethereal Glass (OLED Black) kết hợp với Soft Structuralism.
- **Typography:** 
    - Heading: *PP Editorial New* (hoặc Serif tương đương) cho các tiêu đề lớn.
    - UI Elements: *Geist* hoặc *Plus Jakarta Sans* cho các nhãn và nội dung nhập liệu.
- **Color Palette:** 
    - Nền trái: `#050505` (Deep Black).
    - Nền phải: `#0A0A0A` với lớp Noise/Grain mờ (`0.03`).
    - Accent: White/10 cho các đường viền hairline và hiệu ứng glass.
- **Kiến trúc:** Double-Bezel (Doppelrand) cho mọi khối thành phần.

## 3. Bố cục không gian (Spatial Layout)

### 3.1 Cánh Trái (Narrative Wing - Fixed)
- Chiếm 40-50% chiều ngang, cố định (fixed).
- Hiển thị tiêu đề chương lớn (ví dụ: "BASIC INFO").
- Typography: `text-7xl` hoặc `text-8xl`, in hoa, phông Serif.
- Hiệu ứng: Chữ trượt lên (mask reveal) khi chuyển bước.

### 3.2 Cánh Phải (Action Wing - Scrollable)
- Chiếm 50-60% chiều ngang, có thể cuộn.
- Các nhóm trường nhập liệu được đặt trong các "Double-Bezel Cards".
- Khoảng trống (Whitespace): Sử dụng `py-32` cho các phân đoạn để tạo sự thông thoáng tối đa.

### 3.3 Đảo Điều hướng (Navigation Island)
- Thanh "viên thuốc" nổi ở đáy màn hình.
- `backdrop-blur-3xl bg-black/40 border border-white/10`.
- Chứa nút "Back" và "Next" với kiến trúc Button-in-Button (biểu tượng mũi tên nằm trong hình tròn riêng).

## 4. Thành phần & Tương tác (Components & Interactions)

### 4.1 Ô nhập liệu (Input Fields)
- Không có viền bao quanh (borderless) ở trạng thái mặc định.
- Chỉ có một đường kẻ hairline ở phía dưới.
- Focus state: Một quầng sáng (soft glow) tỏa ra từ phía sau ô nhập liệu.

### 4.2 Chuyển động (Motion)
- **Curves:** Khởi tạo tất cả chuyển động với `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Stagger:** Các khối thông tin bên phải hiện ra lần lượt khi vào trang hoặc chuyển bước.
- **Spring Physics:** Các nút và tab sử dụng vật lý lò xo để tạo cảm giác "vật lý" khi tương tác.

## 5. Cấu trúc kỹ thuật (Technical Architecture)

- **Framework:** Next.js 16 (App Router).
- **Styling:** Tailwind CSS v4.
- **Animation:** Framer Motion (khuyên dùng để xử lý staggered và layout transitions).
- **Icons:** Phosphor Light hoặc Remix Line (nét mảnh).

---

## 6. Tự đánh giá (Self-Review)

1. **Placeholder scan:** Không còn phần TBD.
2. **Internal consistency:** Bố cục Editorial Split đồng nhất với phong cách Cinematic.
3. **Scope check:** Tập trung hoàn toàn vào việc tái thiết kế UI/UX của màn hình tạo Tour, không thay đổi logic backend của `tourService`.
4. **Ambiguity check:** Đã xác định rõ các phông chữ và đường cong chuyển động.

---
*Vui lòng xem xét tài liệu đặc tả này. Nếu bạn đồng ý, tôi sẽ tiến hành lập kế hoạch triển khai (Implementation Plan).*
