## Context

Hệ thống Pathora/Panthora là admin dashboard quản lý tour du lịch. Backend đã có domain model hoàn chỉnh cho việc gán Transport Details (xe bus, máy bay, tàu) và Accommodation Details (khách sạn, nơi nghỉ) vào các booking activities:

- `BookingActivityReservationEntity` — activity trong lịch trình booking
- `BookingTransportDetailEntity` — thông tin vận chuyển (loại xe, số vé, ghế, giờ, giá)
- `BookingAccommodationDetailEntity` — thông tin nơi nghỉ (khách sạn, phòng, check-in/out, giá)

Backend handlers (`CreateTransportDetailCommand`, `CreateAccommodationDetailCommand`, etc.) đã xây xong trong `Application/Features/BookingManagement/Activity/`, nhưng chưa được expose qua HTTP endpoints. Frontend hoàn toàn chưa có UI cho tính năng này.

**Ràng buộc:**
- Frontend: Next.js 16, React 19, Redux Toolkit, Tailwind CSS v4, React Hook Form + Yup
- Backend: ASP.NET Core, Clean Architecture, CQRS pattern
- i18n: i18next (en/vi), dùng existing translation pattern
- API gateway: `NEXT_PUBLIC_API_GATEWAY` → `http://localhost:5182`

## Goals / Non-Goals

**Goals:**
- Admin có thể xem trang chi tiết booking tại `/dashboard/bookings/[id]`
- Admin có thể gán Transport Details vào từng Activity của booking (Deposited+)
- Admin có thể gán Accommodation Details vào từng Activity của booking (Deposited+)
- Transport/Accommodation Details có thể tạo mới, cập nhật, xóa trực tiếp từ trang booking
- Điều kiện: chỉ booking có status `Deposited` trở lên mới hiển thị form gán vé

**Non-Goals:**
- Tạo Activity mới (Activities đã được tạo sẵn khi khách đặt tour)
- Trang quản lý Transport/Accommodation độc lập
- Participants, Payments, Team management trong phase này
- User-facing booking detail page (đã có tại `/bookings/[id]` nhưng dùng sample data)
- Backend tạo thêm domain logic (đã có đầy đủ)

## Decisions

### D1: Backend endpoints — Thêm vào BookingManagementController hay tạo Controller riêng?

**Quyết định: Thêm vào BookingManagementController hiện có.**

**Lý do:** Các endpoint liên quan đến booking đã tập trung ở đây (activities, participants, payables, team). Thêm transport/accommodation vào cùng controller giữ consistent pattern. Backend handlers đã có sẵn trong `Application/Features/BookingManagement/Activity/`.

**Alternatives:** Tạo `BookingTicketController` riêng — bị reject vì phân tán logic booking ra nhiều chỗ.

### D2: Frontend — Monolithic booking detail page hay tách components nhỏ?

**Quyết định: Tách components theo domain.**

```
features/dashboard/components/bookings/BookingDetail/
├── BookingDetailPage.tsx          # Container + layout
├── BookingDetailHeader.tsx        # Header + booking info
├── ActivitySection.tsx            # Một activity = transport + accommodation list
├── TransportDetailForm.tsx        # Form gán/cập nhật transport
├── AccommodationDetailForm.tsx    # Form gán/cập nhật accommodation
├── TransportDetailCard.tsx        # Hiển thị transport đã gán
├── AccommodationDetailCard.tsx    # Hiển thị accommodation đã gán
└── BookingDetailSkeleton.tsx      # Loading state
```

**Lý do:** Booking detail page sẽ phức tạp — có nhiều loại cards, forms, sections. Tách nhỏ giúp tái sử dụng (ví dụ: `TransportDetailCard` có thể dùng lại trong user-facing page sau này). Dựa theo pattern có sẵn của `BookingsPage.tsx` (tách `BookingsTable`, `BookingsStatCards`, etc. ra `ui/`).

### D3: Form handling — React Hook Form + Yup (như existing pattern) hay inline?

**Quyết định: Dùng React Hook Form + Yup, nhưng render inline trong ActivitySection.**

**Lý do:** Backend validation đã có FluentValidation rules (BookingTransportDetailCommands.cs). Yup schemas nên mirror backend rules. Inline form (không modal riêng) giữ context rõ ràng — admin biết đang gán vào activity nào.

### D4: API service layer — Mở rộng bookingService hay tạo service riêng?

**Quyết định: Mở rộng `bookingService.ts` hiện có.**

**Lý do:** Transport/Accommodation details là sub-resource của booking. Endpoint definitions đã có sẵn trong `endpoints/booking.ts`. Tạo service riêng (`ticketService.ts`) không có lợi ích đủ lớn.

### D5: GET transport/accommodation details — Fetch riêng hay trong booking detail response?

**Quyết định: Fetch riêng cho mỗi loại.**

**Lý do:** Backend không có endpoint trả booking detail bao gồm transport + accommodation. Cần:
- `GET /api/bookings/{id}/activities` — lấy danh sách activities
- `GET /api/bookings/{id}/transport-details` — lấy transport details
- `GET /api/bookings/{id}/accommodation-details` — lấy accommodation details

3 requests là acceptable cho mức độ sử dụng thấp (admin click vào 1 booking → xem detail). Không cần optimize sớm.

### D6: Booking status filter — Tab hay filter dropdown?

**Quyết định: Thêm tab filter trên trang bookings list.**

```
┌────────────┬──────────────┬───────────┬──────────┐
│ All        │ Pending      │ Confirmed │ Deposited+ │
└────────────┴──────────────┴───────────┴──────────┘
```

**Lý do:** Booking list hiện tại chưa có filter theo status. Thêm tab đơn giản, clear UX. "Deposited+" tab sẽ show tất cả bookings từ Deposited trở lên — là target group để gán vé.

## Risks / Trade-offs

**[Risk] Backend chưa expose POST/PUT/DELETE cho transport/accommodation details**

→ **Mitigation:** Phải thêm endpoints vào `BookingManagementController` trước khi frontend implement. Backend handlers đã có, chỉ cần wire up controller actions.

**[Risk] Frontend bookingService chưa có methods cho transport/accommodation**

→ **Mitigation:** Thêm methods vào `bookingService.ts` theo pattern có sẵn của `getRecentBookings`.

**[Risk] Backend GET endpoints dùng ownership validator — admin có quyền không?**

→ **Mitigation:** `GetBookingTransportDetailsQuery` dùng `ownershipValidator.CanAccessAsync(booking.UserId)`. Admin không sở hữu booking nhưng cần xem → cần kiểm tra admin có role SuperAdmin/Admin. Có thể cần điều chỉnh `IOwnershipValidator` hoặc tạo query riêng cho admin.

**[Risk] Activities được tạo ở đâu — chưa rõ trong luồng booking**

→ **Mitigation:** Backend có `CreateBookingActivityReservationCommand` nhưng không rõ được gọi ở đâu trong luồng booking. Có thể admin tạo activity thủ công, hoặc có automation trigger. Cần xác nhận: trong phase này, giả định activities đã tồn tại khi booking được tạo.

**[Trade-off] 3 API calls vs 1 combined endpoint**

→ Fetch activities, transport, accommodation riêng = 3 requests. Alternative: tạo 1 endpoint `/api/bookings/{id}/itinerary` trả tất cả. Chọn 3 requests để tránh backend change lớn. Optimize sau nếu cần.

## Open Questions

1. **Activities được tạo khi nào?** Cần xác nhận: activities được tạo tự động khi booking được tạo, hay admin tạo thủ công?
2. **Admin ownership check:** GET endpoints hiện tại dùng `ownershipValidator` — admin có bị block không? Cần test hoặc điều chỉnh.
3. **Thứ tự implement:** Backend endpoints trước hay Frontend trước? Đề xuất: Backend trước (vì không có endpoint thì frontend không có gì gọi).
4. **Booking list filter:** Có cần thêm tab filter ở trang bookings list không, hay chỉ cần link từ booking table row → detail page?
