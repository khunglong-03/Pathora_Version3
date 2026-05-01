# Spec: Custom Tour Request Detail Modal

**Status:** Draft
**Date:** 2026-05-01
**Topic:** Dashboard Custom Tour Request Quick View

## 1. Mục tiêu (Goals)
Cung cấp một bản xem nhanh (Quick View) cho các yêu cầu tour tùy chỉnh ngay tại danh sách, giúp Manager/Tour Operator nắm bắt nhanh nhu cầu của khách hàng mà không cần chuyển trang.

## 2. Bối cảnh (Context)
Hiện tại, trang `custom-tour-requests` hiển thị danh sách các instance có yêu cầu tùy chỉnh. Khi nhấn vào một item, hệ thống chuyển hướng thẳng đến trang Co-design. Việc thêm Modal sẽ giúp cải thiện trải nghiệm người dùng bằng cách cho phép xem ghi chú và giá dự kiến trước khi quyết định xử lý.

## 3. Thiết kế chi tiết (Detailed Design)

### 3.1 Giao diện (UI)
- **Component**: Sử dụng `Modal` từ `@/components/ui`.
- **Header**: Hiển thị "Chi tiết yêu cầu tùy chỉnh" và mã tour.
- **Nội dung (Body)**:
    - **Grid thông tin**: Tên tour, Trạng thái (Badge), Ngày đi, Số lượng khách.
    - **Ghi chú khách hàng**: Box màu Amber nhạt, hiển thị `customizationNotes`.
    - **Thông tin giá**: Hiển thị `basePrice` và `finalSellPrice` (nếu có). Tính toán tổng cộng.
- **Nút hành động (Actions)**:
    - "Đóng": Tắt modal.
    - "Xử lý yêu cầu (Co-design)": Chuyển hướng đến trang chi tiết.

### 3.2 Luồng dữ liệu (Data Flow)
1. User nhấn vào Item trong danh sách.
2. `selectedInstanceId` được cập nhật -> Mở Modal.
3. `useEffect` trong Modal gọi `tourInstanceService.getInstanceDetail(id)`.
4. Hiển thị Loading Skeleton trong khi chờ dữ liệu.
5. Render dữ liệu chi tiết lên Modal.

### 3.3 Ràng buộc (Constraints)
- Phải hỗ trợ cả 2 role: `manager` và `tour-operator` để tạo link chuyển hướng chính xác.
- Nếu không có ghi chú tùy chỉnh, hiển thị thông báo "Không có ghi chú đặc biệt".

## 4. Kế hoạch kiểm thử (Test Plan)
- **Kiểm tra hiển thị**: Modal mở đúng khi click, đóng đúng khi nhấn X hoặc nút Đóng.
- **Kiểm tra dữ liệu**: Hiển thị đúng `customizationNotes` từ API.
- **Kiểm tra điều hướng**: Nút "Xử lý yêu cầu" dẫn đến đúng URL (`/manager/tour-instances/[id]` hoặc `/tour-operator/tour-instances/[id]`).
- **Kiểm tra trạng thái trống**: Xử lý trường hợp API trả về giá trị null/undefined cho các trường tùy chọn.

## 5. Tác động (Impact)
- Chỉ thay đổi file `CustomTourInstanceRequestListPage.tsx`.
- Không ảnh hưởng đến các service hay API hiện có.
