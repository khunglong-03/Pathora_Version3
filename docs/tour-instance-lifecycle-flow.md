## TourEntity Logic (Ưu Tiên Áp Dụng)

Bảng cấu hình `Tour` sau khi rút gọn:

| Thuộc tính | Kiểu | Bắt buộc | Rule sau khi sửa | Mục đích |
|---|---|---|---|---|
| `TourScope` | enum (`Domestic`, `International`) | Có | Field gốc quyết định policy | Xác định tour trong nước/ngoài nước |
| `Continent` | enum? (nullable) | Có điều kiện | Bắt buộc khi `TourScope = International`; phải `null` khi `Domestic` | Chặn dữ liệu sai phạm vi địa lý |
| `RequiresVisa` | bool (default `false`) | Có | Chỉ có ý nghĩa khi `International`; nếu `Domestic` thì ép `false` | Bật/tắt flow hồ sơ visa |

Rule validate:
- `TourScope = Domestic`:
  - `Continent = null`
  - `RequiresVisa = false`
- `TourScope = International`:
  - `Continent` bắt buộc
  - `RequiresVisa` cho phép bật/tắt

Rule khóa hồi tố:
- Nếu tour đã có `TourInstance` active và có booking active, không cho sửa `TourScope`, `Continent`, `RequiresVisa`.
- Muốn đổi policy: clone tour mới thay vì sửa trực tiếp tour đang chạy.

---

# Luồng Vòng đời Tour Instance — Từ Tạo đến Hoàn thành

## Tổng quan

Tài liệu này mô tả toàn bộ luồng xử lý dữ liệu của một **TourInstance** từ lúc Manager tạo đợt tour, qua các bước duyệt khách sạn/xe, khách đặt và thanh toán, đến khi tour hoàn thành.

---

## 1. Sơ đồ trạng thái TourInstance

```mermaid
stateDiagram-v2
    [*] --> PendingApproval : Tạo instance (cần duyệt)
    [*] --> Available : Tạo instance (không cần duyệt)
    PendingApproval --> Available : Tất cả Ground supplier Approved<br/>+ mọi External confirmed
    PendingApproval --> Cancelled : Hủy / auto-timeout
    Available --> Confirmed : Đạt ConfirmationThreshold<br/>HOẶC Manager confirm thủ công
    Available --> SoldOut : CurrentParticipation == MaxParticipation
    Available --> Cancelled : Hủy
    SoldOut --> Available : Có booking cancel → release slot
    SoldOut --> Confirmed : Đạt ConfirmationThreshold
    SoldOut --> Cancelled : Hủy
    Confirmed --> SoldOut : Chỗ đầy lại sau khi confirm
    Confirmed --> InProgress : Ngày khởi hành (StartDate)
    Confirmed --> Cancelled : Hủy (cần admin duyệt)
    Available --> InProgress : StartDate đến dù chưa Confirmed (lock min)
    InProgress --> Completed : EndDate đến
```

**Enum `TourInstanceStatus`:** PendingApproval(7) → Available(1) → Confirmed(2) / SoldOut(3) → InProgress(4) → Completed(5) / Cancelled(6)

**Điều kiện `Available → Confirmed` (làm rõ):**

- **Trigger tự động**: `CurrentParticipation >= TourInstance.MinParticipation` (field đề xuất thêm, hoặc suy từ `Classification.MinParticipation`) **và** `UtcNow >= ConfirmationDeadline` (nếu đã có). Đạt 2 điều kiện này → job auto chuyển `Confirmed`.
- **Trigger thủ công**: Manager phụ trách có thể chuyển `Available → Confirmed` sớm nếu lý do business (VD: đã có đủ nhóm VIP).
- **Ý nghĩa business**: Confirmed = "tour chắc chắn sẽ đi, khóa lại giá, lock lịch với supplier". Sau Confirmed, supplier không được reject (chỉ emergency escalation).
- **Nếu không đạt min đến `StartDate`**: Manager phải hoặc (a) cancel instance (refund hết bookings), hoặc (b) vẫn cho đi với số ít, chuyển thẳng `Available → InProgress` (case "lock min"). Rule này giải thích cạnh trong state machine.

**Ý nghĩa `SoldOut ↔ Available` (bổ sung so với trước):**

- Khi booking bị cancel (thủ công hoặc auto — xem **BƯỚC 5.0**), `ReleaseParticipant` chạy. Nếu instance đang `SoldOut` → quay về `Available`, chứ không nhảy trực tiếp sang `Confirmed`. Cũ ghi "SoldOut → Confirmed : Có chỗ trống lại" là **sai** — đã fix trong diagram.
- `Confirmed → SoldOut` (mới trong diagram): nếu Confirmed rồi mà Manager tăng booking, chạm `MaxParticipation` → chuyển `SoldOut` (vẫn là tour đã chốt sẽ đi).

---

## 2. Sơ đồ trạng thái Booking

Booking có **hai flow song song** tùy `BookingType`:

- **Public (`InstanceJoin`)** — khách book trên đợt tour mở bán, self-service: `Pending → Deposited/Paid → Completed`. State `Confirmed` **không dùng**.
- **Private** — khách liên hệ Manager thương lượng (giá riêng, yêu cầu đặc biệt), Manager chốt trước khi khách trả tiền: `Pending → Confirmed → Deposited/Paid → Completed`.

```mermaid
stateDiagram-v2
    [*] --> Pending : Khách tạo booking
    Pending --> Confirmed : Manager xác nhận (chỉ Private)
    Pending --> Deposited : Khách đặt cọc (Public)
    Pending --> Paid : Khách trả đủ (Public)
    Pending --> Cancelled : Hủy / quá SLA
    Confirmed --> Deposited : Khách đặt cọc (Private)
    Confirmed --> Paid : Khách trả đủ (Private)
    Confirmed --> Cancelled : Hủy
    Deposited --> Paid : Khách trả nốt
    Deposited --> Cancelled : Hủy
    Paid --> Completed : Tour kết thúc
    Paid --> Cancelled : Hủy
```

**Enum `BookingStatus`:** Pending(1) → Confirmed(2) → Deposited(3) → Paid(4) → Completed(6) / Cancelled(5)

**SLA trạng thái Pending (chống slot leakage):**

- Booking `Pending` mà **không có `PaymentTransaction` được tạo** trong **30 phút** kể từ `CreatedOnUtc` → auto-cancel, release slot.
- Booking `Pending` có `PaymentTransaction` nhưng transaction `ExpiredAt` trôi qua mà chưa `Completed` → auto-cancel, release slot.
- Booking `Confirmed` (Private) không chuyển `Deposited/Paid` trong **3 ngày** kể từ `Confirmed` → Manager phải follow-up thủ công (không auto-cancel; private tour có value cao, tránh mất khách do system timeout).
- Chi tiết rule release participant: xem **BƯỚC 5 — Slot Management**.

---

## 2.5 Sơ đồ trạng thái Private Tour Co-Design Feedback

Với booking Private, khách hàng có thể tham gia co-design (tùy chỉnh lịch trình) thông qua việc tạo các yêu cầu (Feedback) trên từng ngày của lịch trình. Vòng đời của Feedback như sau:

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer gửi yêu cầu
    Pending --> ManagerForwarded : Manager duyệt & chuyển Operator
    Pending --> ManagerRejected : Manager từ chối trực tiếp (nếu yêu cầu vô lý)
    ManagerForwarded --> OperatorResponded : Operator phản hồi (có thể đổi final price)
    OperatorResponded --> ManagerApproved : Manager duyệt phản hồi (Customer thấy được)
    OperatorResponded --> ManagerRejected : Manager từ chối phản hồi (yêu cầu Operator làm lại)
    ManagerRejected --> OperatorResponded : Operator phản hồi lại (vòng lặp)
```

**Quy tắc hiển thị (Visibility Gates):**
- **Customer:** Chỉ thấy các feedback `Pending` của chính họ, và các phản hồi từ Operator ĐÃ được Manager duyệt (`ManagerApproved`).
- **Manager:** Thấy toàn bộ, đóng vai trò kiểm duyệt nội dung và giá cả trước khi trình bày cho Customer.
- **Operator:** Thấy các feedback đã được Manager chuyển (`ManagerForwarded`) và xử lý chúng.

---

## 3. Luồng chi tiết từng bước

### BƯỚC 0: Manager tạo/sửa Tour (tiền điều kiện cho mọi instance)

`TourInstance` luôn sinh từ một `TourEntity` đã tồn tại và `Status = Active`. Các cờ nghiệp vụ ở cấp Tour **được kế thừa xuống mọi instance**; muốn đổi policy (VD: bật/tắt visa, đổi châu lục) → Manager sửa ở Tour gốc, không sửa per-instance.

**Entity chính:** `TourEntity`

| Thuộc tính | Mô tả | Trạng thái |
|---|---|---|
| `TourCode` | `TOUR-yyyyMMdd-NNNNN` tự sinh | Đã có |
| `TourName` / `ShortDescription` / `LongDescription` | Nội dung hiển thị | Đã có |
| `Status` | Pending → Active → Inactive / Archived | Đã có |
| `TourScope` | **Domestic** (trong VN) / **International** (nước ngoài) | Đã có |
| `Continent` | **Đúng 1 châu lục** (đơn trị, nullable). Bắt buộc khi `TourScope == International`; luôn `null` khi `Domestic`. | Đã có |
| `CustomerSegment` | Group / Family / Couple / Solo / Corporate | Đã có |
| `TourDesignerId` | FK → designer | Đã có |
| `RequiresVisa` | `bool` — chỉ dùng khi `TourScope == International`; cho phép chọn tour quốc tế có/không cần visa | **GAP — cần thêm** |

**Validator `CreateTourCommand` / `UpdateTourCommand`:**

- `TourScope == International` → `Continent` bắt buộc (rule đã có).
- `TourScope == Domestic` → `RequiresVisa` bắt buộc `false`.
- `TourScope == Domestic` → `Continent = null` (không cho nhập châu lục ở trong nước).
- `TourScope == International` → cho phép bật/tắt `RequiresVisa`.
- (Phase sau) Nếu cần workflow visa chi tiết theo từng quốc gia/deadline thì mới bổ sung thêm field mở rộng.

**UI form (frontend `schemas/tour-form/basic-info.schema.ts`):**

- `Domestic` → chỉ hiển thị `TourScope`; tự set `Continent = null`, `RequiresVisa = false`.
- `International` → hiện thêm `Continent` (bắt buộc) + toggle `RequiresVisa`.
- Không hiển thị cấu hình visa chi tiết theo country/deadline ở bản đơn giản (đẩy sang phase sau).

**Sau khi Tour có `Status = Active`** → Manager mới được phép tạo `TourInstance` (BƯỚC 1).

---

### BƯỚC 1: Manager tạo TourInstance

**Entity chính:** `TourInstanceEntity`

| Thuộc tính | Giá trị khi tạo | Mô tả |
|---|---|---|
| `Id` | Guid v7 tự sinh | Khóa chính |
| `TourId` | FK → Tour gốc | Tour mẫu |
| `ClassificationId` | FK → Classification | Hạng tour |
| `TourInstanceCode` | `TI-yyyyMMddHHmmss-NNNN` | Mã tự sinh |
| `Title` | Do Manager nhập | Tiêu đề đợt |
| `TourName` / `TourCode` | Copy từ Tour | Denormalized |
| `ClassificationName` | Copy từ Classification | Denormalized |
| `InstanceType` | Public hoặc Private | Loại tour |
| `Status` | **PendingApproval** hoặc **Available** | Tùy `requiresApproval` |
| `StartDate` / `EndDate` | Do Manager chọn | Lịch trình |
| `DurationDays` | Tính tự động | `EndDate - StartDate + 1` |
| `MaxParticipation` | Do Manager nhập | Số chỗ tối đa |
| `CurrentParticipation` | **0** | Chưa có ai đặt |
| `BasePrice` | Snapshot từ Classification | Giá cơ bản |
| `Location` | Tùy chọn | Địa điểm |
| `Thumbnail` / `Images` | Ảnh upload | Media |
| `ConfirmationDeadline` | Tùy chọn | Hạn xác nhận |
| `IncludedServices` | Danh sách string | Dịch vụ kèm |
| `IsDeleted` | false | Xóa mềm |
| `RowVersion` | EF auto | Concurrency token |

> **Kế thừa từ Tour (BƯỚC 0)**: `TourInstance` dùng chung `Continent`, `TourScope`, `RequiresVisa` của `TourEntity` cha qua navigation `Tour` — **không copy snapshot**.
>
> **Lock policy để tránh hồi tố khách đã book:** `UpdateTourCommandValidator` phải chặn thay đổi policy (`RequiresVisa`, `Continent`, `TourScope`) khi Tour có bất kỳ `TourInstance` nào ở trạng thái `Available / Confirmed / SoldOut / InProgress` **có ít nhất 1 Booking đang active** (Status ∈ { Pending, Confirmed, Deposited, Paid }).
>
> Manager muốn đổi policy sau thời điểm đó → bắt buộc **Archive Tour gốc và clone Tour mới** (giữ nguyên các instance cũ theo policy cũ, các instance mới tạo sau theo policy mới). Tránh tình trạng khách trả tiền cho tour "không cần visa" rồi bị ép nộp visa hồi tố.

**Đồng thời tạo các entity con:**

#### 1a. `TourInstanceDayEntity` (mỗi ngày trong tour)

| Thuộc tính | Mô tả |
|---|---|
| `TourInstanceId` | FK → Instance cha |
| `TourDayId` | FK → ngày gốc từ Classification |
| `InstanceDayNumber` | Thứ tự: 1, 2, 3... |
| `ActualDate` | Ngày thực tế trên lịch |
| `Title` / `Description` | Nội dung ngày |
| `Activities` | Danh sách hoạt động con |

#### 1b. `TourInstanceDayActivityEntity` (mỗi hoạt động trong ngày)

| Thuộc tính | Mô tả |
|---|---|
| `TourInstanceDayId` | FK → ngày cha |
| `Order` | Thứ tự hoạt động |
| `ActivityType` | Sightseeing / Meal / **Transportation** / **Accommodation** / FreeTime |
| `Title` / `Description` | Nội dung |
| `StartTime` / `EndTime` | Giờ bắt đầu/kết thúc |
| `IsOptional` | Hoạt động tùy chọn? |

**Nếu ActivityType = Transportation:** hệ thống phân hai nhóm (xem thêm `openspec/changes/split-ground-vs-external-transport` và `docs/explore-transport-ground-vs-external.md`):

- **Ground (xe mặt đất trong app):** có nhà cung cấp xe nội bộ, duyệt xe/tài xế, `VehicleBlock` — đúng như các bước 2b / 3b / 4 bên dưới.
- **External (vé máy bay, tàu, phà, … do Manager đặt ngoài):** **không** dùng nhà xe trong app; chỉ lưu thông tin tham chiếu trên activity. `TransportSupplierId` **giữ NULL**; không có luồng gán nhà xe / duyệt nhà xe; chặng này **không** chặn kích hoạt instance vì thiếu duyệt transport (chỉ các chặng Ground có supplier mới tính vào `AreAllTransportationApproved()`).

##### Trường chung mọi Transportation

| Thuộc tính | Mô tả |
|---|---|
| `FromLocationId` / `ToLocationId` | Điểm đi / đến (nếu có) |
| `TransportationType` | Phân loại: Bus, Car, **Flight**, **Train**, Ferry, … (dùng để biết Ground vs External) |
| `TransportationName` | Tên hiển thị / hãng / số hiệu chuyến (vd. “VN123”, “SE1”) |

##### Chỉ áp dụng **Ground** (xe + nhà xe trong hệ thống)

| Thuộc tính | Mô tả |
|---|---|
| `TransportSupplierId` | FK → Nhà cung cấp xe (**NULL lúc tạo**, Manager gán ở BƯỚC 2b) |
| `RequestedVehicleType` | Loại xe yêu cầu (**NULL lúc tạo**, điền khi gán nhà xe) |
| `RequestedSeatCount` | Số ghế yêu cầu (áp cho Ground; so với `MaxParticipation` theo rule validator) |
| `RequestedVehicleCount` | Số xe yêu cầu (tùy chọn) |
| `VehicleId` / `DriverId` | Xe/tài xế cụ thể (**NULL** cho đến khi nhà xe duyệt — BƯỚC 3b) |
| `TransportationApprovalStatus` | **Pending** → **Approved** sau khi nhà xe duyệt |
| `TransportAssignments` | Danh sách xe gán (rỗng lúc tạo; multi-vehicle nếu dùng) |

##### Chỉ áp dụng **External** (vé máy bay / tàu / phà — không nhà xe app)

| Thuộc tính | Mô tả |
|---|---|
| `TransportSupplierId` | **Luôn NULL** — không có “nhà xe” nội bộ cho chặng này |
| `RequestedVehicleType` / `RequestedSeatCount` / `RequestedVehicleCount` | **Không dùng** cho luồng External (hoặc NULL); không bắt buộc khi tạo instance |
| `VehicleId` / `DriverId` | **NULL** — không gán xe/tài xế trong app |
| `BookingReference` | Mã đặt chỗ / PNR / mã vé (nếu Manager nhập lúc lên kế hoạch) |
| `Price` | Giá vé tham chiếu (nếu có) |
| `DepartureTime` / `ArrivalTime` | Giờ cất cánh / ga / cảng (nếu dùng) |
| `TransportationApprovalStatus` | Không dùng cho cổng duyệt nhà xe — External **không** dựa vào luồng approval của supplier |
| `ExternalTransportConfirmed` | **bool, default false** — cờ Manager tự check-off xác nhận "tôi đã đặt xong vé ngoài hệ thống". Chặn kích hoạt instance (BƯỚC 4) khi còn chặng External chưa confirmed. |
| `ExternalTransportConfirmedAt` / `ExternalTransportConfirmedBy` | Audit: thời gian và userId Manager confirm |
| `TransportAssignments` | **Rỗng** — không tạo `VehicleBlock` cho External |

**Rule để được bật `ExternalTransportConfirmed = true`:**
- `BookingReference` không rỗng (có PNR / mã vé thật).
- `DepartureTime` và `ArrivalTime` đã nhập.
- Nếu cần chặt hơn: upload file vé tham chiếu (optional, có thể polish sau MVP).

Manager **không thể** bật confirm khi thiếu thông tin cơ bản → giảm rủi ro "click nhầm confirm" rồi tour bán không có vé thật.

**Sau khi khách đã trả tiền (giai đoạn sản phẩm tiếp theo):** Manager có thể đính file/URL vé (vd. qua `BookingTransportDetailEntity.FileUrl`) và liên kết đúng chặng instance — chi tiết trong cùng initiative OpenSpec (phase 2). Trong tài liệu luồng này, BƯỚC 1 chỉ mô tả dữ liệu **trên instance activity**; vé khách cá nhân có thể bổ sung sau trên booking.

**Nếu ActivityType = Accommodation → tạo thêm:**

#### 1c. `TourInstancePlanAccommodationEntity` (kế hoạch thuần — KHÔNG gắn supplier lúc tạo)

| Thuộc tính | Mô tả |
|---|---|
| `TourInstanceDayActivityId` | FK → Activity cha |
| `RoomType` | Loại phòng **gợi ý** (Single / Double / Family…) — Manager có thể override ở BƯỚC 7 khi gán phòng thật theo party composition của từng booking |
| `EstimatedRoomCount` | `int?` — số phòng **ước lượng** (phục vụ ngân sách + brief hotel); KHÔNG phải số phòng bị hold |
| `CheckInTime` / `CheckOutTime` | Giờ nhận/trả phòng dự kiến |
| `PreferredSupplierId` | `Guid?` — gợi ý hotel Manager định dùng (optional, chỉ để reference; KHÔNG tạo approval/hold) |
| `Location` / `City` / `Area` | Khu vực lưu trú dự kiến (text) |

> **Thay đổi mô hình quan trọng (so với bản trước):** Accommodation **không còn pre-block** ở giai đoạn PendingApproval. Lý do: số phòng thực tế phụ thuộc cấu hình khách (couple → 1 double, solo → 1 single, family 4 → 1 family / 2 double…), không thể biết chính xác lúc tạo instance. Mô hình mới giống **vé máy bay (External transport)**: Manager tự chịu rủi ro availability/giá, chỉ đặt phòng thật sau khi có booking `Paid` (xem **BƯỚC 7**).
>
> Hệ quả:
> - Không có field `SupplierId` / `SupplierApprovalStatus` / `Quantity` cứng trên plan entity.
> - Không có `AssignSupplier` / `ApproveBySupplier` / `RoomBlockEntity` cho accommodation ở giai đoạn pre-activation.
> - `CheckAndActivateTourInstance()` **bỏ** điều kiện accommodation (xem BƯỚC 4).
> - `BasePrice` lúc tạo instance đã bao gồm chi phí lưu trú ước tính; lãi/lỗ thật chỉ chốt ở BƯỚC 7 khi Manager đặt phòng.

---

### BƯỚC 2: Manager gán Nhà cung cấp (Supplier) — **chỉ Transport Ground**

> **Không còn bước gán khách sạn ở giai đoạn này.** Accommodation được gán theo từng booking ở **BƯỚC 7**.

#### 2a. Gán Nhà xe (**chỉ chặng Ground**)

Áp dụng khi activity là **Transportation kiểu Ground** (xe mặt đất, có nhà cung cấp xe trong hệ thống).

Manager gọi `AssignTransportSupplier()` trên `TourInstanceDayActivityEntity`:
- `TransportSupplierId` ← ID nhà xe
- `RequestedVehicleType` ← loại xe (Bus, Car...)
- `RequestedSeatCount` ← số ghế ≥ MaxParticipation
- `RequestedVehicleCount` ← số xe (tùy chọn)
- `TransportationApprovalStatus` ← **Pending**
- Reset: `VehicleId = null`, `DriverId = null`, xóa `TransportAssignments`

**Không có bước “gán nhà xe” cho External:** vé máy bay / tàu / phà chỉ cần Manager nhập/sửa các trường tham chiếu trên activity (điểm đi/đến, loại, tên chuyến, PNR, giờ, giá…). UI tạo/sửa instance ẩn picker nhà xe + loại xe đối với các `TransportationType` được coi là External.

---

### BƯỚC 3: Nhà cung cấp Duyệt — **chỉ Transport Ground**

> Accommodation không có bước supplier duyệt ở giai đoạn pre-activation (mô hình lazy-assign — xem BƯỚC 1c + BƯỚC 7). `RoomBlockEntity` **không còn tạo** ở đây.

#### 3a. Nhà xe duyệt xe + tài xế (**chỉ chặng Ground**)

Chỉ áp dụng khi activity có `TransportSupplierId` (vận chuyển Ground). Chặng **External** không có nhà xe duyệt trong app.

Nhà xe gọi `ApproveTransportation(vehicleId, driverId, note)` trên `TourInstanceDayActivityEntity`:
- `VehicleId` ← xe cụ thể
- `DriverId` ← tài xế
- `TransportationApprovalStatus` ← **Approved**

Hoặc dùng multi-vehicle qua `TourInstanceTransportAssignmentEntity`:

| Thuộc tính Assignment | Mô tả |
|---|---|
| `TourInstanceDayActivityId` | Activity vận chuyển |
| `VehicleId` | Xe cụ thể |
| `DriverId` | Tài xế (tùy chọn) |
| `SeatCountSnapshot` | Copy sức chứa xe tại thời điểm duyệt |

Hệ thống tạo `VehicleBlockEntity` để giữ xe:

| Thuộc tính VehicleBlock | Mô tả |
|---|---|
| `VehicleId` | Xe bị block |
| `TourInstanceDayActivityId` | Activity vận chuyển |
| `BlockedDate` | Ngày giữ xe |
| `HoldStatus` | **Hard** |

#### 3b. Supplier từ chối → Manager gán supplier mới

Khi nhà xe Ground không nhận đơn (hết xe, giá không khớp, lịch bận…), luồng **re-assign** diễn ra:

**Nhà xe Ground từ chối:**
- Nhà xe gọi `RejectTransportation(note)` trên `TourInstanceDayActivityEntity` → `TransportationApprovalStatus = Rejected`, xóa `VehicleBlockEntity`
- Manager gọi `AssignTransportSupplier()` với nhà xe khác → reset về **Pending**
- Chu trình quay về BƯỚC 3a với nhà xe mới; có thể lặp nhiều lần đến khi tìm được nhà xe chịu nhận.
- **Không áp dụng cho External transport** (vé máy bay/tàu/phà — không có supplier nội bộ trong app).
- **Không áp dụng cho Accommodation** (mô hình lazy-assign — không có pre-approval để reject).

> **Lưu ý trạng thái instance**: Trong suốt quá trình re-assign, `TourInstance.Status` vẫn là **PendingApproval**. Chỉ khi TẤT CẢ chặng Ground transport có supplier đạt **Approved** **và** mọi chặng External đã `ExternalTransportConfirmed` thì `CheckAndActivateTourInstance()` mới chuyển sang **Available**. Accommodation KHÔNG còn là gate kích hoạt.

---

### BƯỚC 3.5: Auto-Cancel khi Timeout Duyệt (per-supplier 7 ngày + hard cap 30 ngày)

Để tránh instance treo vô thời hạn khi supplier không phản hồi, áp dụng **timeout tính theo từng supplier** (không theo `CreatedOnUtc` của instance), cộng thêm **hard cap tổng** để chặn loop re-assign vô hạn.

**Vì sao không dùng `CreatedOnUtc`:** Nếu Manager tạo instance day 0, supplier đầu tiên reject day 5, Manager gán supplier mới day 6 — supplier mới chỉ có 1 ngày để phản hồi, không công bằng và dễ miss.

**Field mới trên `TourInstanceDayActivityEntity` (Ground transport):**

| Thuộc tính | Mô tả |
|---|---|
| `SupplierAssignedAtUtc` | Set khi `AssignTransportSupplier` được gọi (kể cả lần đầu lẫn re-assign) |

> Timer chỉ áp dụng cho **Ground transport**. Accommodation không có pre-approval (mô hình lazy-assign ở BƯỚC 7), nên không cần timer per-supplier cho accommodation.

**Quy tắc:**
- **Per-supplier timer**: một Ground transport assignment bị coi là timeout khi `TransportationApprovalStatus == Pending` và `UtcNow - SupplierAssignedAtUtc > 7 days`. Job sẽ tự động `RejectTransportation(note = "Auto-timeout")` và notify Manager để gán nhà xe khác.
- **Hard cap instance**: dù re-assign bao nhiêu lần, nếu `TourInstance.Status == PendingApproval` quá **30 ngày** kể từ `CreatedOnUtc` → **auto-cancel instance** (`CancellationReason = "Timeout tổng: instance treo quá 30 ngày không kích hoạt được"`). Tránh Manager loop re-assign mãi không tìm được nhà xe.
- **Safety**: nếu ngày auto-timeout (theo per-supplier) sẽ vượt quá `TourInstance.StartDate - 3 days` → auto-cancel ngay instance (không đáng gán nhà xe mới khi sát ngày khởi hành).
- Khi instance auto-cancel → dọn `VehicleBlockEntity` theo ER-3 + cascade booking (xem **BƯỚC 9 — Cancel Cascade**). **Không** còn `RoomBlockEntity` để dọn.

**Triển khai đề xuất (GAP — chưa có trong code):**
- Background job (Hangfire / `IHostedService`) chạy mỗi giờ
- Query 1 (per-supplier timeout): scan mọi `TourInstanceDayActivityEntity` (Ground) có `TransportationApprovalStatus == Pending && SupplierAssignedAtUtc < UtcNow - 7 days`
- Query 2 (instance hard cap): `TourInstance.Status == PendingApproval && CreatedOnUtc < UtcNow - 30 days`
- Query 3 (near-start safety): `TourInstance.Status == PendingApproval && StartDate < UtcNow + 3 days`
- Phát event `TourInstanceAutoCancelledEvent` / `SupplierAssignmentTimeoutEvent` để notify Manager phụ trách (`TourInstanceManagerEntity`)

**Cấu hình linh hoạt (`appsettings.json`):**
- `SupplierApprovalTimeoutDays` mặc định **7** (chỉ áp Ground transport)
- `InstancePendingHardCapDays` mặc định **30**
- `NearStartSafetyDays` mặc định **3**

**Notification (đề xuất):**
- Còn **2 ngày đến per-supplier timeout** → nhắc Manager can thiệp (đổi supplier trước khi bị auto-reject)
- Còn **5 ngày đến instance hard cap** → cảnh báo nghiêm trọng
- Khi đã auto-cancel instance: notify mọi supplier còn Pending + Manager phụ trách + mọi booking (nếu đã có — hầu như không có vì instance đang PendingApproval chưa mở bán)

---

### BƯỚC 4: Kích hoạt Tour Instance

Sau khi tất cả nhà xe Ground duyệt xong **và Manager đã confirm mọi chặng External**, hệ thống gọi `CheckAndActivateTourInstance()`:

```
if (Status != PendingApproval) return;

transportGroundOk = AreAllTransportationApproved()
  → Chỉ lọc activity Transportation **có TransportSupplierId** (chặng Ground đã gán nhà xe)
  → Mọi chặng Ground trong tập lọc phải Approved

transportExternalOk = AreAllExternalTransportConfirmed()
  → Lọc activity Transportation **không có TransportSupplierId** (chặng External)
  → Mọi chặng External phải có ExternalTransportConfirmed == true
  → (trước đó đã check BookingReference + DepartureTime + ArrivalTime)

// Accommodation KHÔNG còn là gate — lazy-assign theo từng booking ở BƯỚC 7.

if (transportGroundOk && transportExternalOk)
  → Status = Available ✅
```

**Kết quả:** `TourInstance.Status` chuyển từ **PendingApproval** → **Available** (mở bán cho khách).

**Triggers gọi `CheckAndActivateTourInstance()`:**
- Sau `ApproveTransportation(...)` của nhà xe Ground (BƯỚC 3a)
- Sau Manager bật `ExternalTransportConfirmed = true` trên một activity External

Nếu thiếu một trong hai → instance giữ **PendingApproval**, không mở bán được.

> **Thay đổi so với bản trước:** `AreAllAccommodationsApproved()` bị gỡ khỏi điều kiện kích hoạt. Rủi ro availability/giá phòng chuyển sang Manager ở BƯỚC 7 (giống vé máy bay). Đánh đổi: mở bán sớm hơn, không lãng phí hold phòng, nhưng phải chấp nhận Manager có thể không đặt được hotel đúng ý vào sát ngày.

---

### BƯỚC 5: Khách đặt tour (Booking)

Khách tạo `BookingEntity`:

| Thuộc tính | Giá trị | Mô tả |
|---|---|---|
| `TourInstanceId` | FK → Instance | Đợt tour đặt |
| `UserId` | FK → User (nullable) | Khách đăng nhập |
| `CustomerName` / `Phone` / `Email` | Thông tin khách | Bắt buộc |
| `NumberAdult` | ≥ 1 | Số người lớn |
| `NumberChild` | ≥ 0 | Trẻ em 2-11 tuổi |
| `NumberInfant` | ≥ 0 | Em bé < 2 tuổi |
| `TotalPrice` | Tính từ BasePrice × số người | Tổng giá |
| `PaymentMethod` | VNPay / MoMo / BankTransfer | Cổng thanh toán |
| `IsFullPay` | true/false | Trả đủ hay đặt cọc |
| `BookingType` | InstanceJoin / Private | Loại booking |
| `Status` | **Pending** | Chờ xử lý |

**Đồng thời:**
- `TourInstance.AddParticipant(totalParticipants)` → tăng `CurrentParticipation`
- Nếu `CurrentParticipation == MaxParticipation` → chuyển **SoldOut**
- `BookingType == Private` → không check availability ngay (private tour thương lượng), slot chỉ bị trừ khi Manager chuyển booking sang `Confirmed`

**Concurrency convention (Booking creation):**

- Handler `CreateBookingCommandHandler` chạy trong `IUnitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, …)` — cùng pattern với Approve paths (ER-1/ER-2).
- Đọc `TourInstance.RowVersion` → validate `CurrentParticipation + totalParticipants <= MaxParticipation` → gọi `AddParticipant` → Save.
- Nếu `DbUpdateConcurrencyException` (có booking khác ghi trước): reload, re-check availability.
  - Nếu vẫn còn chỗ → retry transaction một lần.
  - Nếu đã đủ `MaxParticipation` → throw `TourInstance.SoldOut` cho UI; **không** idempotent-return (khác approve path vì đây là lệnh tạo mới, không phải lệnh chuyển trạng thái).
- Cap retry = 1 để tránh race spiraling khi traffic cao.

#### 5.0. Slot Management (chống slot leakage)

Slot được hold ngay khi booking ở `Pending` → cần cơ chế release để tránh bị chiếm ảo.

**Rule:**
- `TourInstance.AddParticipant(n)` khi booking **tạo ra** (Pending).
- `TourInstance.ReleaseParticipant(n)` khi booking chuyển sang `Cancelled` (từ bất kỳ state nào trừ `Completed`).
- Trigger auto-cancel booking (xem **SLA Pending** ở section 2):
  - Pending > 30 phút mà chưa có `PaymentTransaction` → cancel.
  - `PaymentTransaction.ExpiredAt < UtcNow && Status != Completed` → cancel booking + cancel transaction.
- Sau `ReleaseParticipant`: nếu `TourInstance.Status == SoldOut` và `CurrentParticipation < MaxParticipation` → chuyển về `Available`, phát event `TourInstanceBecameAvailableAgainEvent` (có thể notify waitlist sau này).

**Triển khai đề xuất (GAP — chưa có trong code):**
- Background job (Hangfire) chạy mỗi 5 phút
- Query: `Booking.Status == Pending && (CreatedOnUtc < UtcNow - 30min && PaymentTransactions == empty) || PaymentTransaction.ExpiredAt < UtcNow`
- Gọi `Booking.Cancel(reason = "Timeout: chưa thanh toán trong thời gian cho phép", "system")`
- Event `BookingAutoCancelledEvent` để notify khách (nếu có email) + trigger slot release.

#### 5a. Tạo danh sách người tham gia

Mỗi người → `BookingParticipantEntity`:

| Thuộc tính | Mô tả |
|---|---|
| `BookingId` | FK → Booking |
| `ParticipantType` | Adult / Child / Infant |
| `FullName` | Họ tên |
| `DateOfBirth` / `Gender` / `Nationality` | Thông tin cá nhân |
| `Status` | **Pending** |
| `Passport` | Thông tin hộ chiếu (nếu có) |
| `VisaApplications` | Hồ sơ visa (nếu có) |

#### 5b. Tạo hoạt động đã đặt

Mỗi hoạt động → `BookingActivityReservationEntity`:

| Thuộc tính | Mô tả |
|---|---|
| `BookingId` | FK → Booking |
| `SupplierId` | Nhà cung cấp |
| `ActivityType` | Loại hoạt động |
| `Title` | Tên hoạt động |
| `TotalServicePrice` | Giá chưa thuế |
| `TotalServicePriceAfterTax` | Giá sau thuế |
| `Status` | **Pending** |
| `TransportDetails` | Chi tiết vận chuyển con |
| `AccommodationDetails` | Chi tiết lưu trú con |

#### 5c. Hồ sơ Visa (chỉ khi `Tour.RequiresVisa == true`)

**Thứ tự bắt buộc**: Participant → nhập `PassportEntity` trước → tạo `VisaApplicationEntity`. FK `PassportId` **NOT NULL**, bỏ qua passport sẽ fail constraint.

Ở bản đơn giản, mỗi participant cần có hồ sơ visa hợp lệ cho tour quốc tế yêu cầu visa:

| Thuộc tính | Mô tả |
|---|---|
| `BookingParticipantId` | FK → participant |
| `PassportId` | FK → passport (**NOT NULL**) |
| `DestinationCountry` | Quốc gia đích chính (optional ở bản đơn giản; có thể chuẩn hóa ISO ở phase sau) |
| `Status` | `VisaStatus`: Pending → Processing → Approved / Rejected / Cancelled |
| `MinReturnDate` | Visa phải còn hiệu lực đến ngày này |
| `VisaFileUrl` | URL scan hồ sơ visa (1 file) |
| `Visa` (nav) | Link `VisaEntity` sau khi Approved |

**Hành vi ở BƯỚC 5:**
- Booking được phép tạo `Status = Pending` dù chưa đủ visa → khách cần thời gian chuẩn bị hồ sơ.
- UI hiển thị progress "Đã nộp visa X/N participant".
- Validator cứng kích hoạt ở **BƯỚC 6** khi chuyển sang `Deposited/Paid`.

> Nếu cần quản trị visa theo từng quốc gia/zone (ví dụ Schengen) thì thêm rule mở rộng ở phase sau.

---

### BƯỚC 6: Thanh toán

#### 6a. Tạo giao dịch

`PaymentTransactionEntity`:

| Thuộc tính | Mô tả |
|---|---|
| `BookingId` | FK → Booking |
| `TransactionCode` | Mã giao dịch nội bộ |
| `Type` | Deposit / FullPayment / Refund |
| `Status` | **Pending** → Processing → Completed/Failed |
| `Amount` | Số tiền cần thanh toán |
| `PaymentMethod` | VNPay / MoMo / Sepay |
| `CheckoutUrl` | URL thanh toán cho khách |
| `ReferenceCode` | Mã đối soát ngân hàng (max 12 ký tự) |
| `ExpiredAt` | Hạn thanh toán |

#### 6b. Nếu đặt cọc → `CustomerDepositEntity`

| Thuộc tính | Mô tả |
|---|---|
| `BookingId` | FK → Booking |
| `DepositOrder` | Đợt cọc: 1, 2, 3... |
| `ExpectedAmount` | Số tiền cọc dự kiến |
| `DueAt` | Hạn thanh toán cọc |
| `Status` | Pending → **Paid** / Overdue / Waived |

#### 6c. Ghi nhận thanh toán → `CustomerPaymentEntity`

| Thuộc tính | Mô tả |
|---|---|
| `BookingId` | FK → Booking |
| `CustomerDepositId` | FK → đợt cọc (nullable) |
| `Amount` | Số tiền thanh toán |
| `PaymentMethod` | Cổng thanh toán |
| `TransactionRef` | Tham chiếu giao dịch |
| `PaidAt` | Thời gian thanh toán |

#### 6d. Cập nhật Booking Status

```
Webhook/callback thành công
  → PaymentTransaction.MarkAsPaid(amount, paidAt)
  → Booking trạng thái chuyển:
    - Nếu đặt cọc: Pending → Deposited
    - Nếu trả đủ: Deposited → Paid (hoặc Pending → Paid)
```

#### 6e. Chặn thanh toán nếu thiếu visa (chỉ khi `Tour.RequiresVisa == true`)

Trước khi handler cho phép chuyển `Booking.Status: Pending → Deposited/Paid`:

> **Validator cứng**: Với mỗi participant trong booking, phải tồn tại `VisaApplication` với `Status ∈ { Pending, Processing, Approved }`. Thiếu participant nào → throw `Booking.VisaRequirementsNotMet`.

Hiệu ứng khi chặn:
- Cổng thanh toán bị block, khách nhận message "Còn thiếu X visa — vui lòng hoàn tất hồ sơ trước khi thanh toán".
- Booking **giữ nguyên** `Status = Pending`, `PaymentTransaction` không được tạo.
- UI booking hiển thị checklist visa thiếu để khách tự bổ sung.
- **Lưu ý SLA Pending (section 2)**: booking `Pending` không auto-cancel vì lý do "chưa nộp visa" (chỉ auto-cancel khi chưa có `PaymentTransaction` trong 30 phút). Khách có thể giữ booking và từ từ nộp visa — **đã có `PaymentTransaction` draft** trước đó (tạo ra khi khách ấn "thanh toán" lần đầu rồi bị block), nên booking không bị job dọn.

Validator chạy ở Application layer — `CreateBookingCommandHandler` (nếu `IsFullPay = true`) và handler xử lý webhook thanh toán (khi chuyển sang `Deposited`).

#### 6f. Visa deadline (để phase sau)

Ở bản đơn giản chưa bật deadline theo ngày cho visa. Chỉ enforce điều kiện "đủ hồ sơ visa theo participant" trước khi thanh toán.

Nếu cần nâng cấp, có thể thêm lại `VisaSubmissionDeadlineDays` và job reminder/cascade ở phase sau.

---

### BƯỚC 7: Manager gán chi tiết thực tế sau thanh toán (Giai đoạn 2)

Sau khi `Booking.Status == Paid` (hoặc ngay từ **Deposited** nếu Manager đã mua/đặt trước), Manager gán **chi tiết thực tế** cho booking đó — gồm hai nhánh song song: **vé vận chuyển** và **chỗ ở**.

> **Quan trọng về giá (chung cho cả vận chuyển + chỗ ở)**: Toàn bộ chi phí (vé xe, máy bay, tàu, phà, phòng khách sạn…) **đã được gói vào `TourInstance.BasePrice`** lúc Manager tạo instance. Vì vậy:
>
> - Các field `BuyPrice`, `TaxRate`, `TotalBuyPrice` trên các entity ở BƯỚC 7 **KHÔNG** cộng vào giá bán cho khách.
> - Chúng chỉ dùng để ghi nhận **chi phí nội bộ** Manager trả cho supplier → feed vào `SupplierPayableEntity` và báo cáo lãi/lỗ.
> - Khách chỉ thấy `Booking.TotalPrice = BasePrice × số người` — không có breakdown giá từng chặng / từng phòng.
> - Hệ quả: Manager có thể mua vé / đặt phòng sớm (trước khi khách Paid đủ) mà không ảnh hưởng tới giá khách trả → tránh được rủi ro giá tăng.

#### 7a. Gán vé vận chuyển — `BookingTransportDetailEntity`

| Thuộc tính | Mô tả |
|---|---|
| `BookingActivityReservationId` | FK → Activity đã đặt |
| `SupplierId` | Hãng vận chuyển |
| `TransportType` | Flight / Train / Bus / Car / Ferry |
| `DepartureAt` / `ArrivalAt` | Giờ đi / đến |
| `TicketNumber` | Số vé |
| `ETicketNumber` | Số vé điện tử |
| `SeatNumber` | Số ghế |
| `SeatCapacity` | Sức chứa |
| `SeatClass` | Hạng ghế (Economy, Business...) |
| `VehicleNumber` | Biển số xe / mã chuyến bay |
| `BuyPrice` | Giá mua chưa thuế |
| `TaxRate` / `TotalBuyPrice` | Thuế và tổng giá |
| `FileUrl` | **URL file vé/hóa đơn** (Manager upload) |
| `SpecialRequest` | Yêu cầu đặc biệt |
| `Status` | Pending → Confirmed |

> **Quan trọng:** Số lượng `BookingTransportDetail` tạo ra phụ thuộc vào số người trong booking (`NumberAdult + NumberChild + NumberInfant`) × số chặng vận chuyển. Manager gán vé theo đúng số người tham gia.

#### 7b. Gán phòng lưu trú — `BookingAccommodationDetailEntity` (**mới**)

Mô hình song song với 7a cho accommodation. Manager đặt phòng thật với hotel **sau khi biết booking thành công và biết cấu hình khách** (couple/solo/family), rồi gán vào từng activity Accommodation.

| Thuộc tính | Mô tả |
|---|---|
| `BookingActivityReservationId` | FK → Activity Accommodation đã đặt (reservation con của booking) |
| `SupplierId` | FK → Hotel (chọn tại BƯỚC 7, có thể khác `PreferredSupplierId` ở plan) |
| `RoomType` | Single / Double / Twin / Family / Suite… (thực tế đã đặt) |
| `RoomNumber` | Số phòng (nếu hotel cấp trước) |
| `RoomCount` | Số phòng được cấp cho reservation này |
| `CheckInAt` / `CheckOutAt` | Ngày giờ nhận/trả phòng thực tế |
| `GuestNames` | Danh sách participant ở phòng (link tới `BookingParticipantEntity`) |
| `BookingReference` | Mã xác nhận đặt phòng từ hotel (tương đương PNR) |
| `BuyPrice` | Giá phòng chưa thuế |
| `TaxRate` / `TotalBuyPrice` | Thuế và tổng giá |
| `FileUrl` | **URL file voucher / xác nhận đặt phòng** (Manager upload) |
| `SpecialRequest` | Yêu cầu đặc biệt (giường đôi, view biển, cot cho trẻ em…) |
| `Status` | Pending → Confirmed |

**Quy tắc gán phòng:**
- Số `BookingAccommodationDetailEntity` cho 1 booking = số đêm × số phòng thực tế (tùy party composition):
  - 1 couple, 3 đêm → 3 records (1 double / đêm) hoặc 1 record gộp đêm tùy chuẩn hóa.
  - Solo, 3 đêm → 3 records (1 single / đêm).
  - Family 4, 3 đêm → 3 records × (1 family hoặc 2 double) / đêm.
- Manager có thể sửa `RoomType` khác so với gợi ý trên plan (BƯỚC 1c) nếu hotel không có đúng loại.
- Không còn `RoomBlockEntity` ràng buộc — rủi ro availability Manager tự chịu.
- Khi booking cancel (BƯỚC 9): Manager tự hủy với hotel ngoài hệ thống; chi phí đã chi giữ ở `SupplierPayableEntity` để báo cáo lỗ (giống vé máy bay).

**UI flow (gợi ý):**
- Trên màn booking detail, Manager thấy mỗi activity Accommodation có nút "Gán phòng thực tế".
- Form nhập: hotel (dropdown supplier), room type, room count, dates, booking reference, upload voucher.
- Indicator "Đã gán X/N phòng" để Manager không miss activity nào trước khi tour khởi hành.

---

### BƯỚC 8: Tour diễn ra và hoàn thành

```
Ngày khởi hành đến:
  → TourInstance.ChangeStatus(InProgress)

Tracking theo ngày:
  → TourDayActivityStatusEntity (theo dõi từng hoạt động thực tế)

Tour kết thúc:
  → TourInstance.ChangeStatus(Completed)
  → Booking.Complete() → Status = Completed
  → Phát domain event BookingStatusChangedEvent
```

**Công nợ nhà cung cấp:** `SupplierPayableEntity` theo dõi tiền phải trả cho từng supplier (khách sạn, nhà xe) sau khi tour hoàn thành.

---

### BƯỚC 9: Cancel Cascade — Instance bị hủy, booking và tiền đi về đâu

Instance có thể bị cancel ở nhiều mốc (thủ công Manager, auto-timeout BƯỚC 3.5, lý do bất khả kháng...). Doc này chỉ cover phần **cascade xuống booking** — chi tiết refund policy có thể tách ra doc riêng.

**Phân loại theo trạng thái instance lúc cancel:**

#### 9a. Instance ở `PendingApproval` → cancel
- Chưa mở bán → **không có booking**.
- Chỉ cleanup `VehicleBlockEntity` theo ER-3 (Ground transport). Không còn `RoomBlockEntity` để dọn (accommodation lazy-assign).
- Notify nhà xe Ground còn Pending + Manager phụ trách.

#### 9b. Instance ở `Available` / `SoldOut` / `Confirmed` → cancel (đã có bookings)

Mỗi booking trên instance đó cascade theo rule:

| Booking.Status trước cancel | Hành vi cascade |
|---|---|
| `Pending` | Auto-cancel booking (reason: `"Tour instance cancelled by manager/system"`). Release participant. Nếu có `PaymentTransaction` draft → cancel transaction. Không phát sinh refund (khách chưa trả tiền). |
| `Confirmed` (private) | Auto-cancel booking. Không phát sinh refund. Notify Manager sales để liên hệ khách lại. |
| `Deposited` | Auto-cancel booking. Tạo `PaymentTransactionEntity(Type = Refund, Amount = sum(CustomerPayment))` ở state `Pending`. Trigger refund flow thủ công hoặc tự động theo `PaymentMethod`. `CustomerDeposit.Status = Waived`. |
| `Paid` | Giống `Deposited` — refund toàn bộ đã thu. Ưu tiên xử lý vì khách mất tiền nhiều nhất. |
| `Completed` | **Không** cascade — tour đã diễn ra, không ảnh hưởng. (Instance không thể `Cancelled` sau `Completed` theo state machine.) |
| `Cancelled` | No-op (đã cancel trước đó). |

#### 9c. Block cleanup
- `IVehicleBlockRepository.DeleteByTourInstanceAsync` (rule ER-3 đã có) cho Ground transport. **Không còn** `IRoomBlockRepository.DeleteByTourInstanceAsync` vì accommodation không pre-block.
- Các `BookingTransportDetailEntity` đã gán vé (BƯỚC 7a) → Manager phải tự contact hãng hủy vé ngoài hệ thống (chi phí đã chi → `SupplierPayableEntity` giữ nguyên để báo cáo lỗ).
- Các `BookingAccommodationDetailEntity` đã gán phòng (BƯỚC 7b) → tương tự: Manager tự liên hệ hotel để hủy/đổi; chi phí đã trả giữ trong `SupplierPayableEntity` để báo cáo lỗ.

#### 9d. Quyền cancel
- `PendingApproval`: Manager phụ trách bất cứ lúc nào.
- `Available`/`SoldOut`: Manager cấp cao (admin-hierarchy) do ảnh hưởng đến khách đã trả tiền.
- `Confirmed`: tương tự `Available` + bắt buộc lý do + workflow approval nội bộ (ngoài scope doc này).
- `InProgress`: chỉ admin, ca đặc biệt (thiên tai, dịch bệnh). Cascade phức tạp hơn (một phần tour đã xong) — scope giai đoạn sau.

#### 9e. Implementation note (GAP)
- `TourInstanceService.Cancel(reason, cancelledBy)` phải:
  1. Lock instance + mọi booking con trong transaction.
  2. Đổi status instance → `Cancelled`.
  3. Loop qua mỗi booking → apply rule 9b.
  4. Dọn `VehicleBlockEntity` (ER-3). Không còn `RoomBlockEntity`.
  5. Phát event `TourInstanceCancelledEvent` → handler tạo refund transactions + notifications.
- Refund là flow **giai đoạn sau MVP** — tạm thời chỉ ghi log và Manager xử lý thủ công qua ngân hàng. Scope đầy đủ refund automation: tracked ở change proposal riêng.

---

## 3.9. Thứ tự triển khai (Roadmap)

Các thay đổi để visa logic hoạt động theo bản đơn giản. Để dễ đọc theo business, phần xử lý `TourEntity` được đặt lên trước; thứ tự thực thi kỹ thuật vẫn ghi rõ ở cuối mục.

Phân bổ vào luồng runtime ở trên:
- **BƯỚC 0** (Tour) — nơi đặt cờ `RequiresVisa` theo `TourScope/Continent` → thuộc nhóm **B**.
- **BƯỚC 5c** (Booking: hồ sơ visa) + **BƯỚC 6e** (Payment: chặn nếu thiếu visa) → thuộc nhóm **C**.

### B. Thêm cờ visa vào `TourEntity` (BƯỚC 0)

Đây là bước **sửa logic chính ở bảng `TourEntity.cs`** và được đặt lên trên cùng theo business flow.

| # | File | Thay đổi |
|---|---|---|
| B1 | `Domain/Entities/TourEntity.cs` | Field tối giản: `RequiresVisa (bool, default false)`. Logic: chỉ meaningful khi `TourScope == International`. |
| B2 | EF migration | `ALTER TABLE Tour ADD RequiresVisa` (nếu chưa có). Backfill tour cũ: `RequiresVisa = false`. |
| B3 | `CreateTourCommand` + `UpdateTourCommand` | Thêm `JsonPropertyName` cho `RequiresVisa`. |
| B4 | `CreateTourCommandValidator` + `UpdateTourCommandValidator` | Rule: (a) `International` bắt buộc có `Continent`, (b) `Domestic` ép `Continent = null`, (c) `Domestic` cấm bật `RequiresVisa`, (d) nếu `International` thì location phải nằm trong `ContinentCountries[Continent]` (trừ VN nếu có rule nội bộ). |
| B5 | `TourService.Create/Update` | Truyền `TourScope`, `Continent`, `RequiresVisa` xuống entity. |
| B6 | Frontend `basic-info.schema.ts` + form UI | UI conditional: `Domestic` ẩn `Continent/RequiresVisa`; `International` hiện `Continent` + toggle `RequiresVisa`. |

### A. Foundation — chuẩn hóa dữ liệu phạm vi/châu lục

Nền tảng validate dữ liệu location/châu lục cho B/C.

| # | File | Thay đổi |
|---|---|---|
| A1 | `Domain/Constants/ContinentCountries.cs` **(mới)** | Hardcoded `Dictionary<Continent, HashSet<string>>` để validate location theo châu lục khi tour quốc tế. |
| A2 | `Domain/Entities/TourPlanLocationEntity.cs` | Validator: `Country` phải ISO 2-ký tự uppercase hoặc null. Regex `^[A-Z]{2}$`. |
| A3 | `LocationDtoValidator` trong `CreateTourDtos.cs` | Áp cùng rule ISO ở application layer. |
| A4 | Frontend `schemas/tour-form/day-plan.schema.ts` (chỗ khai location) | UI country dropdown thay vì free text. |

### C. Booking-side validator visa (BƯỚC 5c + BƯỚC 6e)

Sau khi B xong. Tour đã có `RequiresVisa` để query.

| # | File | Thay đổi |
|---|---|---|
| C1 | `CreateBookingCommandHandler` | Cho phép tạo Booking `Pending` dù thiếu visa (khách cần thời gian chuẩn bị). Nếu `IsFullPay = true` → áp validator cứng luôn. |
| C2 | Handler chuyển `Booking: Pending → Deposited/Paid` (webhook callback) | **Block** nếu thiếu `VisaApplication(Status ∈ { Pending, Processing, Approved })` cho participant nào trong booking. |
| C3 | `Application/Common/Constant/ErrorConstants.Booking.cs` | Thêm error code `VisaRequirementsNotMet`. |
| C4 | Frontend booking form | UI upload visa theo participant. Indicator "đã nộp X/N participant". Disable nút thanh toán khi thiếu. Phải dẫn khách qua tạo `Passport` trước (FK NOT NULL). |

### D. Polish (sau MVP)

| # | Scope |
|---|---|
| D1 | Nếu cần deadline visa: thêm lại `VisaSubmissionDeadlineDays` + job reminder/cascade. |
| D2 | Nếu cần mức chi tiết cao: `VisaRequirementPolicy` theo country/zone (Schengen = 1 visa dùng nhiều nước). |
| D3 | Nếu cần: mở rộng UI và model để cấu hình visa theo từng country. |
| D4 | Seed `ContinentCountries` cho các châu lục còn lại (Europe, Americas, Oceania, Africa). |

### Phụ thuộc

```
A (foundation) ──▶ B (TourScope/Continent/RequiresVisa — sửa BƯỚC 0) ──▶ C (booking validator — BƯỚC 5c, 6e)
                                                                  └─▶ D (polish, sau MVP)
```

**Thứ tự hiển thị vs thực thi:**
- Hiển thị doc: **B → A → C → D** (để nhìn thấy logic `TourEntity` trước).
- Thực thi kỹ thuật: **A → B → C → D** (đúng phụ thuộc dữ liệu).

**Không đảo thứ tự:**
- Làm C trước B → chưa có field `Tour.RequiresVisa` để query.
- Làm B trước A → validator theo `ContinentCountries` không có lookup dữ liệu.
- Làm D trước C → chưa có use case cho policy/notification phục vụ.

---

## 3.10. Roadmap bổ sung — fix lỗ hổng lifecycle (ngoài visa)

Các GAP khác phát sinh từ review luồng (slot leakage, state ma, external trust, cascade, concurrency).

> **Nguyên tắc thứ tự**: **Tour-level (upstream) trước — TourInstance-level (chi tiết) sau.** `TourEntity` là nguồn policy cho mọi `TourInstanceEntity`; sửa chi tiết instance trước khi sửa gốc tour sẽ sinh mâu thuẫn (ví dụ validate instance theo rule chưa tồn tại trên tour). Doc lifecycle cũng đi theo thứ tự BƯỚC 0 (Tour) → BƯỚC 1+ (Instance), roadmap phải khớp.

---

### LAYER 1 — Tour-level (làm TRƯỚC)

Nhóm động vào `TourEntity`, `TourService`, `UpdateTourCommandValidator`. Phải xong trước layer 2 vì các validator/state ở instance sẽ query các field mới trên tour.

#### K. Lock tour policy khi đã có booking (phụ thuộc roadmap B)

| # | File | Thay đổi |
|---|---|---|
| K1 | `UpdateTourCommandValidator` | Block sửa `RequiresVisa / Continent / TourScope` khi Tour có TourInstance `Available/Confirmed/SoldOut/InProgress` **có booking active**. |
| K2 | `ErrorConstants.Tour` | Thêm error code `CannotModifyVisaPolicyWithActiveBookings`. |
| K3 | Frontend | Hiển thị banner "Tour đang có bookings active — một số field bị khóa, clone tour mới để thay đổi chính sách". |
| K4 | `TourService.CloneTour(tourId)` | Method mới: clone Tour + lịch trình mặc định, cho Manager sửa visa policy trên bản clone. |

> Phụ thuộc: roadmap **B** (Tour có `RequiresVisa` + rule `TourScope/Continent`).

---

### LAYER 2 — TourInstance-level (làm SAU khi layer 1 xong)

Nhóm động vào `TourInstanceEntity`, `TourInstanceDayActivityEntity`, `BookingEntity`, `TourInstanceService`, job cleanup. Sau khi Tour-level ổn, mới đẩy các fix chi tiết xuống instance.

#### E. State machine & enum cleanup

| # | File | Thay đổi |
|---|---|---|
| E1 | `Domain/Enums/BookingStatus` | Thêm XML doc: `Confirmed` chỉ dùng cho `BookingType == Private`, Public flow skip. |
| E2 | `BookingEntity.ChangeStatus(...)` | Validator: nếu `BookingType == InstanceJoin (Public)` → cấm transition `Pending → Confirmed`. |
| E3 | `TourInstanceEntity` | Thêm field `MinParticipation` (hoặc lấy từ `Classification`). Logic `Confirmed` rõ: `CurrentParticipation >= MinParticipation && UtcNow >= ConfirmationDeadline`. |
| E4 | `TourInstanceEntity.CheckAndAutoConfirm()` | Method mới — gọi từ webhook thanh toán (sau mỗi `Paid`) + background job chạy daily. |
| E5 | `TourInstanceEntity.EnsureValidTransition` (hiện ở file entity) | Mở thêm cạnh `SoldOut → Available` (release slot) + `Confirmed → SoldOut` (booking thêm sau confirm). Cạnh `SoldOut → Confirmed` giữ vì auto-confirm vẫn có thể xảy ra khi đủ min. |

#### F. Slot leakage (Pending booking SLA)

| # | File | Thay đổi |
|---|---|---|
| F1 | `BookingEntity.Cancel(reason, by)` | Đảm bảo gọi `TourInstance.ReleaseParticipant(n)` mọi nhánh cancel. |
| F2 | `TourInstanceEntity.ReleaseParticipant(n)` | Method mới (tương tự `RemoveParticipant` hiện có, nhưng kèm event): giảm `CurrentParticipation`. Nếu `Status == SoldOut && CurrentParticipation < MaxParticipation` → `Status = Available`, phát `TourInstanceBecameAvailableAgainEvent`. |
| F3 | Background job mới `BookingTimeoutCleanupJob` | Chạy mỗi 5 phút. Cancel booking `Pending > 30min chưa có PaymentTransaction` hoặc `PaymentTransaction.ExpiredAt < UtcNow`. |
| F4 | `appsettings.json` | `BookingPendingWithoutTransactionMinutes = 30`. |

> Phụ thuộc: **E5** (mở cạnh `SoldOut → Available`) — nếu không, F2 sẽ throw ở `EnsureValidTransition`.

#### I. Cancel cascade booking (phụ thuộc F)

| # | File | Thay đổi |
|---|---|---|
| I1 | `TourInstanceService.Cancel(reason, by)` | Transaction: đổi status + loop booking cascade theo rule BƯỚC 9b + dọn blocks. |
| I2 | Event handler `TourInstanceCancelledEvent` | Tạo `PaymentTransaction(Type = Refund)` cho mỗi booking `Deposited/Paid`. Set state `Pending` để Manager xử lý thủ công. |
| I3 | `CustomerDepositEntity.Status` | Cho phép `Waived` khi cascade cancel. |
| I4 | Quyền (Application/Api layer) | `PendingApproval/Available`: manager phụ trách. `Confirmed/SoldOut`: manager cấp cao. `InProgress`: admin. |

> Phụ thuộc: **F1/F2** (cascade cần `ReleaseParticipant` cho mọi booking con).

#### H. Per-supplier timeout (thay thế `CreatedOnUtc` timer) — **chỉ Ground transport**

| # | File | Thay đổi |
|---|---|---|
| H1 | `TourInstanceDayActivityEntity` | Field mới `SupplierAssignedAtUtc`. Set trong `AssignTransportSupplier` mỗi lần. |
| H2 | EF migration | ALTER + backfill `SupplierAssignedAtUtc = CreatedOnUtc` cho assignment cũ. |
| H3 | Background job `SupplierApprovalTimeoutJob` | Chạy mỗi giờ. Auto-reject Ground transport assignment Pending quá 7 ngày. Auto-cancel instance PendingApproval quá 30 ngày. Auto-cancel instance khi cận `StartDate - 3d`. |
| H4 | `appsettings.json` | `SupplierApprovalTimeoutDays = 7`, `InstancePendingHardCapDays = 30`, `NearStartSafetyDays = 3`. |

> Phụ thuộc: **I** (auto-cancel instance phải dùng cascade đã sẵn sàng).
> Accommodation không có timer vì không có pre-approval (mô hình lazy-assign BƯỚC 7b).

#### G. External transport confirmation gate

| # | File | Thay đổi |
|---|---|---|
| G1 | `TourInstanceDayActivityEntity` | 3 field mới: `ExternalTransportConfirmed (bool, default false)`, `ExternalTransportConfirmedAt`, `ExternalTransportConfirmedBy`. |
| G2 | EF migration | ALTER TABLE. Backfill instance cũ: với activity External đang active → mặc định `true` (tương thích ngược), với activity mới → `false`. |
| G3 | `TourInstanceDayActivityEntity.ConfirmExternalTransport(userId)` | Method mới. Validate `BookingReference + DepartureTime + ArrivalTime` non-null. Set 3 field audit. Gọi `CheckAndActivateTourInstance()`. |
| G4 | `TourInstanceEntity.CheckAndActivateTourInstance()` | Thêm `AreAllExternalTransportConfirmed()` vào điều kiện kích hoạt (hiện tại file entity chỉ check `AreAllTransportationApproved` + `AreAllAccommodationsApproved`, line ~295-307). |
| G5 | Frontend | Nút "Xác nhận đã đặt vé ngoài" trên activity External trong màn instance detail, chỉ enable khi đủ field. |

#### J. Booking concurrency convention

| # | File | Thay đổi |
|---|---|---|
| J1 | `CreateBookingCommandHandler` | Wrap trong `IUnitOfWork.ExecuteTransactionAsync(RepeatableRead, ...)`. |
| J2 | Handler retry logic | Catch `DbUpdateConcurrencyException` 1 lần, re-validate availability, throw `TourInstance.SoldOut` nếu không còn chỗ. |
| J3 | `ErrorConstants.TourInstance` | Đảm bảo có `SoldOut` code. |

> Độc lập — có thể làm bất kỳ lúc nào trong layer 2.

#### L. Accommodation lazy-assign (thay mô hình pre-block bằng gán theo booking)

| # | File | Thay đổi |
|---|---|---|
| L1 | `TourInstancePlanAccommodationEntity` | Gỡ `SupplierId`, `SupplierApprovalStatus`, `SupplierApprovalNote`, `Quantity`, `AssignSupplier`, `ApproveBySupplier`. Thêm `PreferredSupplierId`, `EstimatedRoomCount`, `Location/City/Area`. |
| L2 | `TourInstanceEntity` | Gỡ `AreAllAccommodationsApproved()`; `CheckAndActivateTourInstance()` chỉ gate bởi Ground transport + External transport. |
| L3 | `RoomBlockEntity` + `IRoomBlockRepository` | Đánh dấu obsolete hoặc xóa (không còn dùng ở pre-activation). Nếu muốn giữ cho case Private tour lớn cần lock upfront → scope sau MVP. |
| L4 | EF migration | DROP columns trên `TourInstancePlanAccommodationEntity`; DROP `RoomBlock` table (hoặc rename thành legacy). Backfill null-safe cho instance cũ. |
| L5 | `BookingAccommodationDetailEntity` (**mới**) | Entity mới ở BƯỚC 7b: FK → `BookingActivityReservation`, `SupplierId`, `RoomType`, `RoomCount`, `RoomNumber`, `CheckInAt`, `CheckOutAt`, `GuestNames`, `BookingReference`, `BuyPrice`/`TaxRate`/`TotalBuyPrice`, `FileUrl`, `SpecialRequest`, `Status`. |
| L6 | `SupplierPayableEntity` | Mở rộng để track payable cho hotel supplier từ `BookingAccommodationDetailEntity` (hiện đang chủ yếu cho transport). |
| L7 | Frontend | Xóa UI gán hotel ở màn tạo/sửa instance. Thêm màn "Gán phòng thực tế" trên booking detail (BƯỚC 7b). Indicator "Đã gán X/N phòng" trên booking list. |
| L8 | `ErrorConstants.Booking` | Thêm code cho validation ở BƯỚC 7b nếu cần (vd. `AccommodationDetailIncomplete`). |

> Phụ thuộc: **E/F/I** (cascade booking + state machine đã ổn). Đây là thay đổi mô hình lớn — nên làm sau khi layer 1 + E/F/I xong để tránh conflict migration.

---

### Phụ thuộc giữa nhóm (tóm tắt)

```
LAYER 1 — Tour-level (UPSTREAM)
  A (visa foundation) ──▶ B (Tour visa fields) ──▶ K (lock visa policy)

         │
         ▼  (layer 1 xong mới sang layer 2)

LAYER 2 — TourInstance-level (DETAIL)
  E (state/enum cleanup) ──▶ F (slot release, cần E5) ──▶ I (cascade, cần F1/F2)
                                                           │
                                                           ▼
                                                         H (timeout, cần I)

  G (external gate)  ── độc lập trong layer 2
  J (booking concurrency) ── độc lập trong layer 2
  C (booking visa validator) ── phụ thuộc B, cùng layer 2
  L (accommodation lazy-assign) ── phụ thuộc E/F/I

  D (polish: zone, prefill, seed) ── sau cùng
```

### Thứ tự thực hiện đề xuất

**Layer 1 (Tour) trước:**
1. **A** → foundation ISO country
2. **B** → visa fields trên `TourEntity`
3. **K** → lock policy khi có booking

**Layer 2 (TourInstance) sau:**
4. **E** → state machine / enum sạch (mở các cạnh transition mới)
5. **F** → slot release + timeout pending booking (cầm máu doanh thu)
6. **I** → cancel cascade (dùng F)
7. **C** → booking validator visa (khớp với layer 1 đã có field)
8. **H** → per-supplier timeout Ground transport (dùng I để cascade khi hard-cap)
9. **G** → external transport gate
10. **J** → booking concurrency convention
11. **L** → accommodation lazy-assign (gỡ pre-block → gán theo booking, migration lớn)
12. **D** → polish (visa zone, prefill country, seed continent khác)

**Lý do không đảo:**
- `K` / `C` cần `B` xong (query field visa trên Tour).
- `F` / `I` / `H` cần `E5` mở cạnh transition, nếu không entity throw ngay `EnsureValidTransition`.
- `H` cần `I` sẵn sàng: khi instance auto-cancel do hard-cap, cascade booking phải hoạt động, tránh instance `Cancelled` nhưng booking vẫn `Pending/Paid` treo.
- `G` / `J` / `D` không ảnh hưởng thứ tự phần khác, có thể chen bất kỳ chỗ nào trong layer 2.

---

## 4. Sơ đồ tổng hợp toàn bộ luồng

```mermaid
flowchart TD
    A["🟦 BƯỚC 1: Manager tạo TourInstance"] --> A1["TourInstanceEntity<br/>Status = PendingApproval"]
    A1 --> A2["TourInstanceDayEntity × N ngày"]
    A2 --> A3["TourInstanceDayActivityEntity × M hoạt động/ngày"]
    A3 --> A4["PlanAccommodationEntity<br/>(kế hoạch thuần — KHÔNG gắn supplier)<br/>RoomType gợi ý, EstimatedRoomCount"]

    A1 --> B["🟧 BƯỚC 2: Gán Nhà xe Ground"]
    B --> B2["Gán nhà xe → TransportSupplierId<br/>RequestedVehicleType, SeatCount<br/>ApprovalStatus = Pending"]

    B2 --> C["🟩 BƯỚC 3: Nhà xe duyệt"]
    C --> C2["Nhà xe Approve<br/>→ Gán Vehicle + Driver<br/>→ Tạo VehicleBlock (giữ xe)<br/>→ Tạo TransportAssignment"]

    C2 --> D["🟨 BƯỚC 4: Kích hoạt"]
    A3 --> CX["Manager confirm External transport<br/>(BookingReference, DepartureTime...)"]
    CX --> D
    D --> D1{"Ground Transport Approved?<br/>External Transport Confirmed?"}
    D1 -->|Có| D2["Status = Available ✅<br/>Mở bán cho khách"]
    D1 -->|Chưa| D3["Vẫn PendingApproval<br/>(Ground per-supplier 7d timeout, instance 30d hard cap)"]

    D2 --> E["🟪 BƯỚC 5: Khách đặt tour"]
    E --> E1["BookingEntity<br/>Status = Pending<br/>SLA: 30min chưa PaymentTransaction → cancel"]
    E --> E2["BookingParticipantEntity × số người"]
    E --> E3["BookingActivityReservationEntity × hoạt động"]
    E --> E4["CurrentParticipation += số người<br/>(ReleaseParticipant nếu booking cancel)"]

    E1 --> F["🟥 BƯỚC 6: Thanh toán"]
    F --> F1["PaymentTransactionEntity<br/>→ CheckoutUrl cho khách"]
    F --> F2["CustomerDepositEntity<br/>(nếu đặt cọc)"]
    F --> F3["CustomerPaymentEntity<br/>(ghi nhận tiền vào)"]
    F --> FV{"Tour.RequiresVisa?"}
    FV -->|Yes| FV1["6e: Chặn nếu thiếu visa<br/>6f: Enforce deadline"]
    FV1 --> F3
    FV -->|No| F3
    F3 --> F4["Booking.Status = Paid ✅"]

    F4 --> G["🟫 BƯỚC 7: Manager gán chi tiết"]
    G --> G1["7a: BookingTransportDetailEntity<br/>× số người × số chặng<br/>(TicketNumber, SeatNumber, FileUrl)"]
    G --> GA["7b: BookingAccommodationDetailEntity<br/>× đêm × số phòng<br/>(RoomType theo party, BookingRef, FileUrl voucher)"]
    G1 --> H["✅ BƯỚC 8: Tour diễn ra"]
    GA --> H
    H --> H1["Status = InProgress"]
    H1 --> H2["TourDayActivityStatus tracking"]
    H2 --> H3["Status = Completed 🎉"]
    H3 --> H4["SupplierPayableEntity<br/>(thanh toán cho supplier)"]

    D2 -.cancel path.-> Z["⛔ BƯỚC 9: Cancel Cascade"]
    E1 -.cancel path.-> Z
    F4 -.cancel path.-> Z
    Z --> Z1["Dọn VehicleBlock<br/>(không còn RoomBlock — accommodation lazy-assign)"]
    Z --> Z2["Cascade bookings theo Status:<br/>Pending/Confirmed → cancel<br/>Deposited/Paid → refund flow<br/>+ Manager tự hủy vé/phòng đã đặt với supplier ngoài hệ thống"]
```

---

## 5. Bảng tham chiếu Entity

| Entity | File | Vai trò |
|---|---|---|
| `TourInstanceEntity` | `Domain/Entities/TourInstanceEntity.cs` | Đợt tour chính |
| `TourInstanceDayEntity` | `Domain/Entities/TourInstanceDayEntity.cs` | Ngày trong tour |
| `TourInstanceDayActivityEntity` | `Domain/Entities/TourInstanceDayActivityEntity.cs` | Hoạt động trong ngày |
| `TourInstancePlanAccommodationEntity` | `Domain/Entities/TourInstancePlanAccommodationEntity.cs` | Kế hoạch lưu trú (gợi ý, KHÔNG gắn supplier — roadmap **L**) |
| `TourInstanceTransportAssignmentEntity` | `Domain/Entities/TourInstanceTransportAssignmentEntity.cs` | Gán xe cụ thể |
| `TourInstanceManagerEntity` | `Domain/Entities/TourInstanceManagerEntity.cs` | Manager phụ trách |
| `RoomBlockEntity` | `Domain/Entities/RoomBlockEntity.cs` | ⚠️ Obsolete sau roadmap **L** (accommodation lazy-assign) |
| `VehicleBlockEntity` | `Domain/Entities/VehicleBlockEntity.cs` | Giữ chỗ xe (Ground transport) |
| `BookingEntity` | `Domain/Entities/BookingEntity.cs` | Đặt tour |
| `BookingParticipantEntity` | `Domain/Entities/BookingParticipantEntity.cs` | Người tham gia |
| `BookingActivityReservationEntity` | `Domain/Entities/BookingActivityReservationEntity.cs` | Hoạt động đã đặt |
| `BookingTransportDetailEntity` | `Domain/Entities/BookingTransportDetailEntity.cs` | Chi tiết vé vận chuyển (BƯỚC 7a) |
| `BookingAccommodationDetailEntity` (**mới**) | `Domain/Entities/BookingAccommodationDetailEntity.cs` | Chi tiết phòng lưu trú — gán per-booking sau Paid (BƯỚC 7b, roadmap **L**) |
| `PaymentTransactionEntity` | `Domain/Entities/PaymentTransactionEntity.cs` | Giao dịch thanh toán |
| `CustomerDepositEntity` | `Domain/Entities/CustomerDepositEntity.cs` | Đợt đặt cọc |
| `CustomerPaymentEntity` | `Domain/Entities/CustomerPaymentEntity.cs` | Khoản thanh toán |
| `SupplierPayableEntity` | `Domain/Entities/SupplierPayableEntity.cs` | Công nợ nhà cung cấp |

---

## 6. Enum tham chiếu

| Enum | Giá trị |
|---|---|
| `TourInstanceStatus` | PendingApproval(7) → Available(1) → Confirmed(2) / SoldOut(3) → InProgress(4) → Completed(5) / Cancelled(6) |
| `BookingStatus` | Pending(1) → Confirmed(2) → Deposited(3) → Paid(4) → Completed(6) / Cancelled(5) |
| `ProviderApprovalStatus` | NotAssigned(0) → Pending(1) → Approved(2) / Rejected(3) |
| `HoldStatus` | Soft / Hard |
| `DepositStatus` | Pending → Paid / Overdue / Waived |
| `TransactionStatus` | Pending → Processing → Completed / Failed / Cancelled / Refunded |
