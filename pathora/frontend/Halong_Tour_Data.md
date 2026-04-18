# Dữ liệu mẫu để tự nhập khi tạo tour mới

File này được viết lại theo hướng dễ copy/paste từng field vào form tạo tour mới trong frontend.
Nó khớp với logic `buildTourFormData`, nhưng ưu tiên để bạn tự nhập thủ công thay vì import seed SQL.

---

## 1) Thông tin cơ bản

### Tiếng Việt / nhập vào form chính
- **tourName:** Khám Phá Vịnh Hạ Long - Di Sản Thiên Nhiên Thế Giới (2 Ngày 1 Đêm)
- **shortDescription:** Trải nghiệm nghỉ dưỡng 2 ngày 1 đêm tại Hạ Long với lịch trình tham quan và lưu trú cao cấp.
- **longDescription:** Tour Hạ Long 2 ngày 1 đêm mang đến trải nghiệm nghỉ dưỡng, tham quan và di chuyển thuận tiện. Khách sẽ tham quan vịnh, nghỉ đêm tại khách sạn/resort, và có lịch trình chi tiết theo từng ngày.
- **seoTitle:** Tour Hạ Long 2 Ngày 1 Đêm | Pathora
- **seoDescription:** Đặt ngay tour Hạ Long 2 ngày 1 đêm với lịch trình tham quan, lưu trú và dịch vụ phù hợp cho nhóm khách.
- **status:** `1` hoặc giá trị status mà form của bạn đang dùng
- **tourScope:** `Trong nước`
- **continent:** `Asia`
- **customerSegment:** `Group`

### Bản dịch

#### Vietnamese translation
- **tourName:** Khám Phá Vịnh Hạ Long - Di Sản Thiên Nhiên Thế Giới (2 Ngày 1 Đêm)
- **shortDescription:** Tour tham quan và nghỉ dưỡng tại Hạ Long.
- **longDescription:** Trải nghiệm tour Hạ Long 2 ngày 1 đêm với lịch trình hợp lý, phù hợp cho khách đi nhóm.
- **seoTitle:** Tour Hạ Long 2 Ngày 1 Đêm | Pathora
- **seoDescription:** Tour Hạ Long 2 ngày 1 đêm dành cho nhóm khách muốn tham quan và nghỉ dưỡng.

#### English translation
- **tourName:** Discover Halong Bay - 2 Days 1 Night
- **shortDescription:** A 2-day, 1-night sightseeing and leisure tour in Halong Bay.
- **longDescription:** Enjoy a carefully planned Halong Bay journey with sightseeing, accommodation, and group-friendly activities.
- **seoTitle:** Halong Bay 2 Days 1 Night Tour | Pathora
- **seoDescription:** Book a 2 days 1 night Halong Bay tour with sightseeing and accommodation.

---

## 2) Classifications

Form hiện tại dùng `classifications[]`, mỗi classification là một gói tour.

### Gói tour 1
- **name:** Standard
- **enName:** Standard Package
- **description:** Gói tiêu chuẩn 2 ngày 1 đêm tại Hạ Long.
- **enDescription:** Standard 2 days 1 night Halong package.
- **basePrice:** `2500000`
- **durationDays:** `2`

---

## 3) Day plans và activities

Mỗi classification có `dayPlans[]`, mỗi day plan có `activities[]`.

### Ngày 1
- **dayNumber:** `1`
- **title:** Khởi hành & Nhận phòng
- **enTitle:** Departure & Check-in
- **description:** Xe đón khách từ Hà Nội, di chuyển đến Hạ Long và nhận phòng.
- **enDescription:** Pick up from Hanoi, transfer to Halong, and check in.

#### Activity 1 — Transport
- **Loại hoạt động:** `Phương tiện`
- **activityType:** `7`
- **Ý nghĩa:** dùng cho hoạt động di chuyển, khi chọn loại này form sẽ hiện các ô Từ/Đến/Phương tiện/Thời lượng.
- **title:** Xe Limousine Hà Nội - Hạ Long
- **enTitle:** Limousine Hanoi - Halong Transfer
- **description:** Đón khách tại Hà Nội và di chuyển đến Hạ Long.
- **enDescription:** Pick up in Hanoi and transfer to Halong.
- **note:** Có nước uống và wifi trên xe.
- **enNote:** Complimentary water and wifi on board.
- **estimatedCost:** `0`
- **isOptional:** `false`
- **startTime:** `08:00`
- **endTime:** `10:30`
- **fromLocation:** Hà Nội
- **enFromLocation:** Hanoi
- **toLocation:** Hạ Long
- **enToLocation:** Halong
- **transportationType:** `1`
- **enTransportationType:** Car
- **durationMinutes:** `150`
- **price:** `0`

#### Activity 2 — Accommodation
- **Loại hoạt động:** `Lưu trú`
- **activityType:** `8`
- **Ý nghĩa:** dùng cho hoạt động lưu trú, khi chọn loại này form sẽ hiện các ô Khách sạn/Địa chỉ/Check-in/Check-out.
- **title:** Nhận phòng & Nghỉ ngơi
- **enTitle:** Check-in & Relax
- **description:** Nhận phòng tại Vinpearl Resort & Spa Hạ Long.
- **enDescription:** Check in at Vinpearl Resort & Spa Halong.
- **note:** Nghỉ ngơi và sử dụng tiện ích tại resort.
- **enNote:** Free time to relax and use resort facilities.
- **estimatedCost:** `0`
- **isOptional:** `false`
- **startTime:** `14:00`
- **endTime:** `14:30`
- **locationName:** Vinpearl Resort & Spa Hạ Long
- **enLocationName:** Vinpearl Resort & Spa Halong
- **locationCity:** Hạ Long
- **enLocationCity:** Halong
- **locationCountry:** Việt Nam
- **enLocationCountry:** Vietnam
- **locationAddress:** Đảo Rều, Vịnh Hạ Long, Quảng Ninh
- **enLocationAddress:** Reu Island, Halong Bay, Quang Ninh, Vietnam
- **locationEntranceFee:** `0`

### Ngày 2
- **dayNumber:** `2`
- **title:** Tham quan Vịnh & Trở về
- **enTitle:** Bay Sightseeing & Return
- **description:** Tham quan vịnh Hạ Long rồi trở về Hà Nội.
- **enDescription:** Visit Halong Bay and return to Hanoi.

#### Activity 1 — Sightseeing
- **activityType:** `0`
- **title:** Du thuyền tham quan Vịnh Hạ Long
- **enTitle:** Halong Bay Cruise Sightseeing
- **description:** Tham quan Động Thiên Cung và các điểm nổi bật trên vịnh.
- **enDescription:** Visit Thien Cung Cave and other highlights of the bay.
- **note:** Mang theo máy ảnh và nón chống nắng.
- **enNote:** Bring a camera and a sun hat.
- **estimatedCost:** `0`
- **isOptional:** `false`
- **startTime:** `08:00`
- **endTime:** `12:00`

---

## 4) Insurances

### Bảo hiểm 1
- **insuranceName:** Bảo hiểm du lịch nội địa cao cấp
- **enInsuranceName:** Premium Domestic Travel Insurance
- **insuranceType:** `1`
- **insuranceProvider:** Bảo Việt
- **coverageDescription:** Chi trả y tế và tai nạn trong suốt hành trình.
- **enCoverageDescription:** Covers medical and accidents during the trip.
- **coverageAmount:** `50000000`
- **coverageFee:** `50000`
- **isOptional:** `false`
- **note:** Áp dụng cho toàn bộ hành trình.
- **enNote:** Applies to the full trip.

---

## 5) Services

### Dịch vụ bổ sung 1
- **serviceName:** Nâng hạng phòng Ocean View
- **enServiceName:** Ocean View Room Upgrade
- **pricingType:** `1`
- **price:** `1000000`
- **salePrice:** `900000`
- **email:** `service@pathora.vn`
- **contactNumber:** `0909123456`

---

## 6) Policy IDs nếu form có hỗ trợ

Nếu màn hình tạo tour của bạn có các ô này thì có thể điền, còn không thì để trống:
- **selectedPricingPolicyId:** `pricing-policy-demo`
- **selectedDepositPolicyId:** `deposit-policy-demo`
- **selectedCancellationPolicyId:** `cancellation-policy-demo`
- **selectedVisaPolicyId:** `visa-policy-demo`

---

## 7) Ghi chú quan trọng

- Dữ liệu này đã được chỉnh để khớp với logic `buildTourFormData`.
- `classifications` là nơi chứa `plans`, `locations`, `accommodations`, `insurances` theo payload hiện tại.
- `dayPlans[].activities[]` là nơi chứa toàn bộ logic lịch trình.
- `activityType` đang dùng theo logic form hiện tại, nên nếu dropdown của bạn map khác số thì hãy đổi lại cho đúng enum đang dùng trong app.
- Nếu form của bạn không có `tourScope`, `continent`, hoặc `customerSegment` thì có thể bỏ qua các trường đó.
