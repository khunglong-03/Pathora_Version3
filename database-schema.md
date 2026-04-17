# 🧠 Pathora_Version3: Giải Thích Cấu Trúc Cơ Sở Dữ Liệu

Tài liệu này giải thích chi tiết ý nghĩa và vai trò của toàn bộ các bảng (Entities) trong hệ thống Pathora (Tour Management System), được ánh xạ từ `AppDbContext.cs`.

Hệ thống được chia thành các nhóm Domain chính (Bounded Contexts) để dễ hình dung:

---

## 1. 🛡️ User & Access Control (Phân quyền & Người dùng)
Quản lý nhân sự, người dùng, phân quyền RBAC và cấu trúc tổ chức của công ty.

*   **`Users`**: Bảng dữ liệu người dùng (Bao gồm nhân viên, quản lý, điều hành, và có thể là khách hàng nếu có tài khoản).
*   **`Roles`**: Các vai trò trong hệ thống (vd: Admin, Tour Manager, Sales, Operator).
*   **`UserRoles`**: Bảng trung gian ánh xạ User và Role (Nhiều - Nhiều).
*   **`Departments`**: Phòng ban trong công ty (vd: Phòng Sales, Phòng Điều Hành).
*   **`Positions`**: Chức vụ của nhân viên (vd: Trưởng phòng, Nhân viên).
*   **`UserSettings`**: Lưu trữ cài đặt và tuỳ chọn cá nhân của từng User (UI preferences, notification settings).
*   **`ManagerBankAccounts`**: Lưu thông tin tài khoản ngân hàng của Tour Manager để nhận tạm ứng hoặc hoàn ứng kinh phí tour.

---

## 2. 🗂️ Core Tours (Khuôn mẫu Tour - Master Template)
Đây là phần lõi dùng để cấu hình ra một "Sản phẩm Tour" (chưa chạy thực tế, chỉ là khuôn mẫu/chương trình gốc). Ví dụ: "Tour Nhật Bản Cung Vàng 7N6Đ".

*   **`Tours`**: Bảng gốc lưu thông tin tổng quan của một sản phẩm Tour (Tên, mô tả, ảnh bìa...).
*   **`TourClassifications`**: Phân loại tour (vd: Nghỉ dưỡng, Thám hiểm, Nội địa, Quốc tế).
*   **`TourDays`**: Các ngày trong 1 khuôn mẫu Tour (Ngày 1, Ngày 2...).
*   **`TourDayActivities`**: Các hoạt động cụ thể trong từng ngày (Ăn sáng, Thăm bảo tàng, Ngủ đêm).
*   **`TourPlanAccommodations`**: Cấu hình khuôn mẫu về nơi ở cho Tour (vd: Yêu cầu khách sạn 4 sao).
*   **`TourPlanLocations`**: Các địa điểm sẽ ghé thăm trong Tour.
*   **`TourPlanRoutes`**: Lộ trình di chuyển cấu hình sẵn (Từ điểm A đến điểm B).
*   **`TourInsurances`**: Các gói bảo hiểm áp dụng theo khuôn mẫu Tour này.
*   **`TourResources`**: Tài nguyên media (ảnh, video) gắn với thiết kế của Tour.
*   **`TourDayActivityResourceLinks`**: Các đường link tài liệu, hướng dẫn chi tiết gắn riêng với 1 hoạt động.
*   **`TourManagerAssignments`**: Phân công Manager phụ trách thiết kế khuôn mẫu Tour.
*   **`TourDayActivityGuides`** / **`TourDayActivityStatuses`**: Cấu hình trạng thái và HDV định danh cho các hoạt động mẫu.

---

## 3. 🚀 Tour Instances (Tour Thực tế / Lịch khởi hành)
Khi một khuôn mẫu Tour được mở bán vào một ngày cụ thể (vd: "Tour Nhật Bản ngày 15/10"), nó sẽ sinh ra một Instance.

*   **`TourInstances`**: Khởi tạo của một Tour có ngày đi và ngày về thực tế, nhận booking.
*   **`TourInstanceDays`**: Bản sao của `TourDays`, nhưng có ngày tháng năm (tuyệt đối) cụ thể chạy tour.
*   **`TourInstanceDayActivities`**: Bản sao các hoạt động chạy trong thực tế.
*   **`TourInstancePlanAccommodations`**: Nơi lưu trú thực tế được chốt cho Instance này (nhà cung cấp cụ thể, số lượng block).
*   **`TourInstancePlanRoutes`**: Tuyến đường đi thực tế của Instance.
*   **`TourInstanceManagers`**: Người Quản lý Tour / Điều hành được assign chạy cái lịch khởi hành cụ thể này.

---

## 4. 👥 Bookings & Customers (Đặt chỗ & Khách hàng)
Nhóm quản lý thông tin khách hàng, rổ hàng và từng hành khách cụ thể trong booking.

*   **`Bookings`**: Đơn hàng đặt chỗ vào một `TourInstance`, lưu tổng tiền, mã đặt chỗ, thông tin người đại diện.
*   **`BookingParticipants`**: Danh sách từng hành khách cụ thể tham gia trong booking đó (tên, tuổi).
*   **`BookingActivityReservations`**: Nếu khách hàng đặt thêm hoặc có hoạt động tuỳ chọn.
*   **`BookingTransportDetails`**: Phương tiện của nhóm khách booking (đón tiễn).
*   **`BookingAccommodationDetails`**: Chi tiết yêu cầu phòng nghỉ của booking.
*   **`BookingTourGuides`**: HDV được sắp xếp phục vụ nhóm khách này (nếu tour private/custom).
*   **`GuestArrivals`**: Cấu hình chuyến bay/xe đón khi khách đến tập trung.
*   **`GuestArrivalParticipants`**: Ánh xạ hành khách nào đi chuyến bay/xe nào để ra lệnh đón khách.

---

## 5. 🛂 Visa & Passport (Thủ tục xuất nhập cảnh)
Các bảng dành cho tour quốc tế để theo dõi và upload thông tin giấy tờ của khách.

*   **`Passports`**: Thông tin hộ chiếu của `BookingParticipants`.
*   **`VisaApplications`**: Hồ sơ xin Visa của khách hàng (Đang xử lý, Chờ cấp).
*   **`Visas`**: Thông tin Visa đã được cấp (Số Visa, thời hạn).

---

## 6. 💼 Suppliers & Operations (Nhà cung cấp & Điều phối thực địa)
Quản lý bên thứ 3 cung cấp dịch vụ và quá trình phân bổ tài nguyên thực tế.

*   **`Suppliers`**: Đối tác cung cấp (Khách sạn, Hãng bay, Nhà xe, Hướng dẫn viên tự do).
*   **`Vehicles`**: Xe khách, ô tô do nhà cung cấp xe (hoặc nội bộ) quản lý.
*   **`Drivers`**: Tài xế phục vụ xe.
*   **`TourDayActivityRouteTransports`**: Chốt điều xe + tài xế nào cho lộ trình cụ thể trong ngày của Tour.
*   **`HotelRoomInventories`**: Kho phòng (Quỹ phòng) còn trống của khách sạn (Supplier).
*   **`RoomBlocks`**: Số lượng phòng thực tế đã chọn (block) cho một hoạt động nghỉ đêm trong `TourInstanceDayActivity`.

---

## 7. 💰 Finance & Payments (Tài chính, Thanh Toán & Chính sách)

**Khách hàng thanh toán:**
*   **`CustomerPayments`** / **`CustomerDeposits`**: Tiền đặt cọc và thanh toán từ phía khách hàng (Inflow).
*   **`Payments`** / **`PaymentTransactions`**: Cấu trúc Transaction lịch sử thanh toán chung.

**Thanh toán đối tác:**
*   **`SupplierPayables`**: Các khoản Công nợ phải trả cho nhà cung cấp.
*   **`SupplierReceipts`**: Chứng từ đã thanh toán/phiếu thu từ nhà cung cấp.

**Chính sách & Cấu hình giá:**
*   **`PricingPolicies`**: Cấu hình giá tự động (ví dụ: Trẻ em 70% giá, giảm giá mùa thu).
*   **`CancellationPolicies`**: Luật phạt hủy (vd: Hủy trước 7 ngày mất 50%).
*   **`DepositPolicies`**: Luật đặt cọc (Bắt buộc cọc 30% để giữ chỗ).
*   **`TaxConfigs`**: Cấu hình thuế (VAT 8%, VAT 10%) áp lên các gói dịch vụ.
*   **`VisaPolicies`**: Quy định về xử lý Visa.

---

## 8. 🛠️ System, Logging & Utilities (Hệ thống & Tiện ích)
Các bảng hạ tầng và vận hành hệ thống.

*   **`FileMetadatas`**: Quản lý ảnh/video/tài liệu được upload (URL, size, MinIO/S3 reference).
*   **`SiteContents`**: CMS nội dung website (Bài viết mồi, điều khoản website, chính sách quyền riêng tư).
*   **`SystemKeys`**: Bảng Constants biến hệ thống tĩnh cắm cờ (Flags, Variables).
*   **`RefreshTokens`**: Giữ JWT session phiên đăng nhập lâu dài.
*   **`PasswordResetTokens`**: Lưu token đổi mật khẩu dùng một lần (OTP/Link).
*   **`Mails`**: Hàng đợi / Lịch sử gửi Email.
*   **`logErrors`**: Bảng lưu lịch sử lỗi Exception tập trung để dễ debug.
*   **`TourRequests`**: Form khách hàng tự điền yêu cầu thiết kế Tour Custom.
*   **`Reviews`**: Đánh giá và Feedback của khách khi đi xong tour.
*   **`Registers`**: Đăng ký đại lý hoặc yêu cầu tạo tài khoản mới.
*   **`OutboxMessages`**: Bảng Outbox Pattern (Event-Driven) dùng để đảm bảo gửi event an toàn vào message broker (RabbitMQ/Kafka) mà không bị kẹt transaction DB.

---
*Tài liệu này được tạo tự động dựa trên `AppDbContext.cs` để hỗ trợ Team nắm bắt kiến trúc tổng thể.*
