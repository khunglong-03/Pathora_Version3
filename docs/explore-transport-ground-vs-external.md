# Khám phá: Tách Transport thành Ground vs External Booking

> **Trạng thái:** Exploration doc — chưa phải OpenSpec proposal chính thức.
> **Ngày:** 2026-04-24
> **Bối cảnh:** Bug "dropdown phương tiện hiển thị máy bay / phi thuyền trong khi supplier không cung cấp" + không filter được đúng loại xe.

---

## 1. Vấn đề gốc

Khi Manager tạo TourInstance và gán supplier cho activity di chuyển, dropdown loại phương tiện lòi ra những giá trị mà supplier thực tế **không thể cung cấp** (máy bay, tàu thủy, …). Hậu quả:

- Manager chọn `Flight` ở tour plan → sang TourInstance không có supplier nào match → workflow kẹt.
- Vehicle supplier không có trường nào để khai mình phục vụ loại hình gì → filter không chạy đúng.
- Một supplier xe đường bộ bị lòi ra như thể có thể chở máy bay.

---

## 2. Nguyên nhân: 3 enum chạy song song, không bắt tay nhau

Codebase đang có **ba** khái niệm "loại phương tiện" tách biệt ở ba tầng:

```
┌─────────────────────────────────────────────────────────────────┐
│ TẦNG 1: TOUR PLAN (Manager vẽ lịch trình)                       │
│   TourDayActivityEntity.TransportationType                      │
│   → Walking, Bus, Train, Flight, Boat, Car, Bicycle,            │
│     Motorbike, Taxi, Other                                      │
│   Enum: TransportationType                                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼ tạo TourInstance, gán supplier
┌─────────────────────────────────────────────────────────────────┐
│ TẦNG 2: TOUR INSTANCE ACTIVITY (Manager chọn xe muốn thuê)      │
│   TourInstanceDayActivityEntity.RequestedVehicleType            │
│   → Car, Bus, Minibus, Van, Coach, Motorbike                    │
│   Enum: VehicleType  ⚠️ comment nói rõ "ground transport only — │
│                           airplane/train/boat not included"      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼ provider duyệt, gán xe thật
┌─────────────────────────────────────────────────────────────────┐
│ TẦNG 3: SUPPLIER FLEET (Nhà xe khai báo xe của họ)              │
│   VehicleEntity.VehicleType                                     │
│   → Car, Bus, Minibus, Van, Coach, Motorbike                    │
│   Enum: VehicleType  (ground only)                              │
└─────────────────────────────────────────────────────────────────┘
```

Và còn một enum thứ 4 (`TransportType`: Airplane/Bus/Train/Ship/Car/Other) trôi nổi như một bản nhái.

### Chỗ gãy

Tầng 1 cho chọn rộng (Flight/Boat/Walking/…), Tầng 2 & 3 chỉ có Ground → map fail:

```
Tour Plan                 Instance Activity            Supplier's Vehicle
──────────                ─────────────────            ──────────────────
Bus          ─────────▶   VehicleType.Bus      ──▶    Vehicle(Bus)        ✅
Car          ─────────▶   VehicleType.Car      ──▶    Vehicle(Car)        ✅
Motorbike    ─────────▶   VehicleType.Motorbike──▶    Vehicle(Motorbike)  ✅
Flight       ─────────▶   ❌ VehicleType không có Flight
Boat         ─────────▶   ❌ VehicleType không có Boat
Train        ─────────▶   ❌ VehicleType không có Train
Walking      ─────────▶   ❌ vô nghĩa với supplier
Bicycle      ─────────▶   ❌ không có
```

`VehicleEntity` cũng không có trường "mode/category" cao hơn để supplier tuyên bố "tôi chỉ chạy đường bộ" hay "tôi có ferry" → filter không chạy đúng được.

---

## 3. Phương án kiến trúc (chốt hướng C)

> **Ghi chú phạm vi:** Hai hướng từng cân nhắc sớm — **cắt enum** Tour Plan xuống trùng `VehicleType`, và **thêm `TransportMode` lên supplier/vehicle** — **không** đi tiếp trong doc này (đã loại khỏi bàn chi tiết). Toàn bộ phần sau bám **hướng C** và biến thể C-gọn / C-đầy đủ.

So sánh ngắn với phương án còn lại được xem xét song song:

| # | Hướng | Ưu | Nhược |
|---|-------|-----|-------|
| **C** | **Tách hai nhánh:** Ground → Supplier + Vehicle (như hiện tại). Air/Rail/Sea → External booking (lưu tham chiếu vé: hãng, chuyến, PNR, …), không cần supplier nội bộ duyệt | Trung thực nghiệp vụ; giữ `VehicleEntity` chỉ cho đường bộ | Hai code path — UI và handler cần branch |
| **D** | Chỉ sửa UI Tour Plan: picker chỉ còn Ground; bay/tàu ghi trong `Other` + free-text | Không đụng BE | Mất cấu trúc — khó query/report chặng bay/tàu |

**Kết luận:** **C** — phù hợp thực tế "nhà xe trong app; máy bay/tàu Manager tự book ngoài".

---

## 4. Chi tiết hướng C

### Ý tưởng cốt lõi

Tách hẳn 2 loại "di chuyển" trong hệ thống, vì bản chất nghiệp vụ khác hẳn nhau:

```
┌──────────────────────────────┐      ┌────────────────────────────────┐
│  GROUND TRANSPORT            │      │  EXTERNAL TRANSPORT            │
│  (Bus/Car/Minibus/Van/…)     │      │  (Flight / Train / Ferry)      │
├──────────────────────────────┤      ├────────────────────────────────┤
│  Có supplier nội bộ đăng ký  │      │  Không có supplier nội bộ      │
│  Có fleet (VehicleEntity)    │      │  Manager book vé ngoài         │
│  Có driver                   │      │  Chỉ lưu thông tin vé          │
│  Có approve workflow         │      │  Không cần approve             │
│  Có VehicleBlock (giữ chỗ)   │      │  Không cần block inventory     │
│  → Flow hiện tại, giữ nguyên │      │  → Flow mới, đơn giản          │
└──────────────────────────────┘      └────────────────────────────────┘
```

### Lý do phải tách — lifecycle khác hẳn

| Câu hỏi | Ground | Flight/Train/Ferry |
|---|---|---|
| Ai sở hữu phương tiện? | Nhà xe địa phương đăng ký hệ thống | Vietnam Airlines, đường sắt VN, Phú Quốc Express — không đăng ký vào app |
| Ai duyệt? | Provider nhấn "Approve" trong hệ thống | Không ai — Manager tự đặt vé |
| Có giữ chỗ (block) không? | Có — VehicleBlock để tránh 2 tour đặt cùng 1 xe | Không — mỗi ghế trên máy bay là vé riêng |
| Cần biển số + tài xế? | Có | Không — chỉ cần số chuyến, giờ bay, PNR |
| Rủi ro 2 tour cùng thuê 1 xe? | Có → cần concurrency control | Không |

### Nhu cầu sản phẩm: chuyến có cấu trúc vs vé chỉ là bằng chứng (ảnh/PDF)

Hướng **C** tách rõ hai lớp thông tin cho chặng External:

```
┌─────────────────────────────────────────────────────────────────┐
│  CẤU TRÚC (luôn ưu tiên trong app — chung mọi loại vé)            │
│  Giá, điểm đi/đến (hoặc mã), giờ khởi hành/đến, loại chuyến, …   │
│  → TourInstanceDayActivityEntity (C-gọn) hoặc + bảng booking     │
│     (C-đầy đủ)                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  BẰNG CHỨNG VÉ (tránh normalize thuộc tính lệch nhau từng hãng) │
│  Ảnh chụp vé / PDF / URL file — "đúng như khách nhìn thấy"       │
│  → C-đầy đủ: TicketDocumentUrl; C-gọn: mở rộng sau hoặc link     │
│     attachment chung                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Khớp nhu cầu:** Máy bay / tàu / du thuyền **không** bắt hệ thống phải có cùng schema chi tiết (số ghế, hạng, mã hãng, …); phần **đọc được cho khách** có thể là **một ảnh/PDF**. Phần **giá và hành trình** vẫn **ghi rõ có cấu trúc** để báo giá, lịch, hóa đơn.

### Sau thanh toán: “gán vé / PNR” cho người đặt

**Hướng C** (activity + External fields) mô tả **chặng trên lịch trình** và tham chiếu vé **cấp đoàn / Manager**. Nó **không tự** thực hiện:

- gán PNR sau khi **khách** thanh toán,
- hay đính kèm ảnh vé **theo từng người mua**,

trừ khi bổ sung **lớp đơn hàng / fulfillment** (đã phác ở **mục 9** — allocation theo `OrderId` / booker + `Quantity`, file ảnh vé theo dòng đơn hoặc theo participant).

```
Thanh toán thành công          Lớp tour (C)
        │                            │
        └──────────▶ (proposal) ────┴──▶ cập nhật allocation + URL vé
                      theo order / booker
```

**Kết luận khớp C:** C **thỏa** tách Ground/External và giữ **nội dung chuyến có cấu trúc + vé dạng ảnh**. Việc **“sau pay thì gán vé cho đúng user”** là **bước thêm** (order domain + mục 9), không nằm trọn trong C-gọn thuần activity.

---

## 5. Hai cách triển khai C

### C-gọn: KHÔNG thêm bảng mới ⭐ (đề xuất)

Phát hiện quan trọng: `TourInstanceDayActivityEntity` **đã có sẵn** tất cả các trường inline cần cho External booking, đang bị bỏ không:

```
TourInstanceDayActivityEntity (đã tồn tại, không cần thêm entity)
├── TransportationType       ← enum đã có đủ (Flight, Train, Boat, Bus, …)
├── TransportationName       ← "Vietnam Airlines VN1546"
├── BookingReference         ← "PNR ABC123"
├── Price                    ← giá vé (đã có tính phí sẵn)
├── DepartureTime
├── ArrivalTime
├── FromLocationId / ToLocationId
├── DurationMinutes
└── DistanceKm
```

Thay đổi thực sự cần làm — branching theo `TransportationType`:

```
Khi Manager tạo activity di chuyển:

Chọn TransportationType
│
├── Flight / Train / Boat / Walking / Bicycle
│       → UI hiện form External (dùng fields có sẵn):
│          TransportationName, BookingReference, Price,
│          Departure/Arrival, From/To
│       → KHÔNG set TransportSupplierId / VehicleId / …
│       → TransportationApprovalStatus = N/A (hoặc auto = Approved)
│       → Không tạo VehicleBlock
│
└── Bus / Car / Minibus / Van / Coach / Motorbike / Taxi
        → UI hiện form Ground (như hiện tại):
           TransportSupplierId, RequestedVehicleType,
           RequestedSeatCount, RequestedVehicleCount
        → Provider phải duyệt → TransportAssignments[]
        → Tạo VehicleBlock như bình thường
```

### Checklist thay đổi C-gọn

| Layer | Thay đổi |
|---|---|
| Domain enum | Thêm comment/helper đánh dấu values nào là Ground vs External |
| `CheckAndActivateTourInstance` | Activity External bỏ qua khỏi check "all approved" |
| `AreAllTransportationApproved()` | Chỉ xét những activity có `TransportSupplierId`, bỏ qua External |
| API `CreateTourInstance` payload | Nhận field External (hoặc validate: nếu TransportationType là external → không được gửi supplier/vehicle) |
| Frontend form | Branch UI theo TransportationType — ẩn supplier picker cho Flight/Boat/Train |
| Frontend dropdown supplier | Filter theo `RequestedVehicleType` (fix bug gốc) |

**Zero migration schema. Zero entity mới. Chỉ là logic branching + UI conditional.**

---

### C-đầy đủ: Thêm entity `ExternalTransportBookingEntity`

Chỉ nên làm khi:
- Cần lưu PDF vé, audit history, structured carrier/flight no. riêng biệt
- Muốn tách hẳn bảng để query/report Flight/Train/Boat gọn
- Có requirement phức tạp hơn sau này (nhiều hành khách / nhiều vé cho 1 chặng, phân ghế, …)

Data model sẽ có thêm:

```
TourInstanceDayActivityEntity (đã có)
├── ActivityType = Transportation
├── TransportationType  ← vẫn là enum rộng (Flight/Train/Boat/Bus/Car/…)
│
├── NẾU là Ground (Bus/Car/Minibus/Van/Coach/Motorbike):
│   ├── TransportSupplierId       ← supplier nội bộ
│   ├── RequestedVehicleType      ← VehicleType (ground-only)
│   ├── RequestedSeatCount
│   ├── RequestedVehicleCount
│   ├── TransportAssignments[]    ← Vehicle + Driver cụ thể
│   └── TransportationApprovalStatus
│
└── NẾU là External (Flight/Train/Boat):
    └── ExternalTransportBooking (1-1 navigation) ← ENTITY MỚI
        ├── Carrier            (VD: "Vietnam Airlines")
        ├── BookingReference   (VD: "VN1546 / PNR ABC123")
        ├── DepartureTime
        ├── ArrivalTime
        ├── OriginCode         (VD: "HAN")
        ├── DestinationCode    (VD: "SGN")
        ├── SeatInfo           (optional free text)
        └── TicketDocumentUrl  (nếu có vé PDF)
```

Chi phí: 1 entity, 1 migration, 1 navigation, thêm DTO + mapping.

---

## 6. So sánh C-gọn vs C-đầy đủ

| Tiêu chí | C-gọn | C-đầy đủ |
|---|---|---|
| Entity mới | 0 | 1 |
| Migration | 0 (chỉ config/logic) | 1 bảng mới |
| Sửa enum | Không | Không |
| Sửa UI | Có (branching form) | Có (branching form) |
| Sửa backend handlers | Có (skip external khỏi approve check) | Có + mapping entity mới |
| Fix được bug "dropdown có máy bay" | ✅ | ✅ |
| Lưu PDF vé | ❌ (phải mở rộng sau) | ✅ (sẵn chỗ) |
| Risk thấp hơn | ✅ | Trung bình |

---

## 7. UI flow sau khi áp C-gọn

```
Manager chọn TransportationType:
┌─────────────────────────────────────────────┐
│ 🔽 Loại di chuyển                            │
│    ─── Ground (có supplier trong hệ thống) ─│
│    • Bus                                     │
│    • Car                                     │
│    • Minibus / Van / Coach / Motorbike       │
│    ─── External (tự book vé) ───────────────│
│    • Flight                                  │
│    • Train                                   │
│    • Boat / Ferry                            │
└─────────────────────────────────────────────┘

        │
        ├──▶ Nếu chọn Ground:
        │    ┌────────────────────────────────────┐
        │    │ Loại xe:    [Bus      ▼]           │
        │    │ Số ghế:     [45]                   │
        │    │ Số xe:      [1]                    │
        │    │ Supplier:   [🔍 lọc supplier có    │
        │    │              Bus 45 chỗ ▼]          │
        │    └────────────────────────────────────┘
        │            → provider duyệt → chọn xe cụ thể
        │
        └──▶ Nếu chọn External:
             ┌────────────────────────────────────┐
             │ Hãng/Tên:   [Vietnam Airlines VN…] │
             │ Giờ đi:     [07:00 HAN]            │
             │ Giờ đến:    [09:15 SGN]            │
             │ Mã đặt:     [ABC123]               │
             │ Giá vé:     [1.800.000]            │
             └────────────────────────────────────┘
                        → không có workflow approve
                        → activity coi như "sẵn sàng" ngay
```

### Lọc supplier đúng cách (fix bug gốc)

Khi Manager đã chốt `RequestedVehicleType = Bus, RequestedSeatCount = 45`:

```sql
SELECT Supplier
WHERE Supplier.Type = Transport
  AND EXISTS (
    SELECT 1 FROM Vehicle v
    WHERE v.SupplierId = Supplier.Id
      AND v.VehicleType = 'Bus'
      AND v.SeatCapacity >= 45
      AND v.IsActive
  )
```

→ **Dropdown chỉ hiện supplier thực sự có Bus ≥45 chỗ.** Không lòi ra "máy bay" vì tụi nó không tồn tại trong `VehicleEntity`. Bug biến mất tự nhiên.

---

## 8. Tác động lên các vấn đề bạn nêu

| Vấn đề | C-gọn giải quyết thế nào |
|---|---|
| Dropdown xe có Airplane/Boat/Phi thuyền | Flight/Boat chuyển sang nhánh External — không đi vào supplier dropdown nữa |
| Không map được sang loại xe supplier cung cấp | Ground chỉ còn 6 loại, match 1:1 với `VehicleType` |
| Không có trường "loại" để lọc | `VehicleType` đã là trường lọc chính; filter sẽ chạy đúng ngay |
| Supplier nhỏ không có máy bay | OK vì họ không cần — máy bay không còn là "phương tiện" trong hệ thống, nó là "vé" |
| Activity đã có tính phí (`Price`) | Giữ nguyên — External dùng đúng field đó, không duplicate |

---

## 9. Phân bổ vé External theo người đặt / đơn hàng (Order)

> **Phạm vi:** Bổ sung logic nghiệp vụ *ngoài* phần “một activity = một khối tham chiếu vé” của C-gọn. Đây là lớp **thương mại & thực hiện đơn**, không thay thế việc `TourInstanceDayActivityEntity` mô tả **chặng** trong lịch trình.

### 9.1. Vấn đề cần mô hình hóa

Thực tế một **TourInstance** có thể được **nhiều người đặt** (nhiều **booker** / nhiều **đơn**), mỗi người mua **số vé (slot) External** khác nhau cho **cùng một hoạt động di chuyển** (ví dụ chặng bay tuần 1):

| Booker | Ví dụ số vé máy bay cho chặng đó |
|--------|----------------------------------|
| Người A | 5 |
| Người B | 10 |

Khi **hóa đơn / order** được tạo, cần thể hiện được:

- **Gán** phần “vé External” của **activity đó** cho **từng người đặt** (hoặc từng đơn con) với **đúng số lượng** (5 vs 10), không chỉ một con số tổng trên activity.

**Lưu ý:** Số vé phải bám theo **số người / slot thực sự mua cho chặng đó**, không tự động bằng tổng số khách cả tour nếu không phải ai cũng đi chặng External đó.

### 9.2. Hướng C-gọn / C-đầy đủ trong file này *chưa* thể hiện điều đó ở đâu

- **C-gọn:** `TourInstanceDayActivityEntity` có **một** `BookingReference` (PNR) + `Price` + thời gian/địa điểm — mức **kế hoạch / tham chiếu chặng** cho Manager. Không có entity con “vé ↔ booker ↔ order line”.
- **C-đầy đủ:** `ExternalTransportBookingEntity` (nếu có) vẫn là **1-1 với activity** trong sketch mục 5; có thể mở rộng `SeatInfo` dạng text nhưng **không** tự suy ra phân bổ 5 vé cho A và 10 vé cho B trên hóa đơn.

→ Logic “**nhiều người đặt, mỗi người N vé trên cùng activity**” cần **lớp dữ liệu bổ sung** (bảng quan hệ hoặc dòng order), **không** nằm gọn trong các trường inline External của activity.

### 9.3. Ranh giới trách nhiệm (để tránh trùng model)

```
TourInstanceDayActivity (External)     Order / Commercial layer
─────────────────────────────────      ──────────────────────────
“Chặng này là bay/tàu, PNR tham chiếu,  “Ai đã trả tiền cho bao nhiêu slot
 giờ, giá kế hoạch (có thể)”            của chặng đó?” → allocation / line items
```

- **Activity:** định danh **chặng** trong tour (tuần/ngày, loại `TransportationType`, thông tin vé do Manager nhập).
- **Order / hóa đơn:** định danh **giao dịch**; phân bổ số vé theo **booker** hoặc **order line** trỏ về `TourInstanceDayActivityId` (hoặc `ExternalTransportBookingId` nếu đã tách C-đầy đủ).

### 9.4. Hướng thiết kế đề xuất (exploration — chưa implement)

**Mục tiêu:** Cho phép query: *với activity External X, booker A có 5 vé, booker B có 10 vé*; đồng thời in/ghi trên hóa đơn đúng số lượng.

**Phương án A — Dòng phân bổ (khuyến nghị mô tả domain):**

- Thêm (hoặc tái dùng) khái niệm kiểu **`ExternalTransportAllocation`** (tên gợi ý) hoặc **order line mở rộng** với các trường tối thiểu:
  - `TourInstanceDayActivityId` (chặng External tương ứng)
  - `OrderId` hoặc `BookerId` / `CustomerOrderPartyId` (tuỳ domain hiện có)
  - `Quantity` (số vé / slot cho chặng đó)
  - (Tuỳ chọn) `UnitPrice`, `Currency`, `WeekIndex` / `Sequence` nếu cần tách hiển thị “tuần 1” trên UI
- Ràng buộc nghiệp vụ (sau này chốt ở spec): tổng `Quantity` theo activity **không vượt** số chỗ đã book thực tế (nếu hệ thống có nguồn sự thật từ PNR); hoặc chỉ là **số lượng bán** nội bộ nếu PNR ngoài hệ thống.

**Phương án B — Nhiều PNR trên cùng chặng:**

- Nếu thực tế **mỗi booker một PNR riêng**, có thể:
  - **Tách** thành nhiều activity External liên tiếp cùng ngày/chặng (khó báo cáo), **hoặc**
  - Giữ **một** activity “logical leg” + **nhiều** dòng allocation mỗi dòng có `BookingReference` riêng (C-đầy đủ nên để `ExternalTransportBooking` **1-n** với activity thay vì 1-1 nếu chọn hướng này).

**Phương án C — Chỉ ghi chú:**

- Không đủ cho hóa đơn có cấu trúc; chỉ dùng khi không cần báo cáo theo booker.

### 9.5. Liên hệ với OpenSpec / bước sau

- Phần **Ground vs External** (mục 1–8) có thể ship trước **mà không bắt buộc** có allocation; khi có requirement **đa booker + đúng số vé trên order**, cần **change/proposal riêng** (order domain) và tham chiếu chéo `TourInstanceDayActivityId`.
- Nếu chốt **C-đầy đủ**, nên thiết kế quan hệ `ExternalTransportBooking` **1-n** với activity **sớm** nếu dự kiến nhiều PNR / nhiều lô vé trên một chặng.

---

## 10. Câu hỏi còn lại để chốt scope

Trước khi convert doc này thành OpenSpec proposal chính thức, cần trả lời:

1. **Có cần upload PDF vé không?** → Nếu có thì nghiêng C-đầy đủ; nếu không thì C-gọn là đủ.
2. **Vé máy bay/tàu có cần tính vào tổng chi phí tour không?** → Nếu có, đã có `Price` field dùng được.
3. **Có cần audit "ai đã nhập số chuyến bay này" không?** → Nếu chỉ cần created/modified by là xong, C-gọn đủ.
4. **Manager có cần edit External booking sau khi đã tạo không?** (thay đổi chuyến bay, dời ngày, …) → Nếu có, cần flow edit riêng.
5. **Khi có booking mà cancel tour, có cần hoàn tiền/thông báo gì đặc biệt không?** → Nếu có workflow refund riêng thì cần plan thêm.
6. **Có cần phân bổ vé External theo từng người đặt / từng order (mục 9) không?** → Nếu có, tách proposal order/fulfillment; xem có một PNR chung hay nhiều PNR để chọn 9.4-A vs 9.4-B.

---

## 11. Next step đề xuất

1. **Trả lời 6 câu hỏi mục 10** để chốt scope giữa C-gọn và C-đầy đủ, và có/không lớp phân bổ mục 9.
2. Nếu C-gọn → tạo OpenSpec change `split-ground-vs-external-transport` với:
   - `proposal.md`: mô tả why + what changes
   - `design.md`: chi tiết branching logic, impact lên `CheckAndActivateTourInstance`
   - `tasks.md`: checklist implement (backend handlers, frontend form branching, filter supplier dropdown)
   - `specs/`: nếu có spec modify
3. Nếu chốt **có** phân bổ vé theo booker/order (mục 9) → OpenSpec **riêng** cho domain đơn/hóa đơn (allocation + ràng buộc số lượng), tham chiếu `TourInstanceDayActivityId` / booking External.

Mình không implement gì cho đến khi bạn duyệt proposal.

---

## Ref

- `panthora_be/src/Domain/Enums/TransportationType.cs` — enum dùng ở Tour Plan
- `panthora_be/src/Domain/Enums/VehicleType.cs` — enum ground-only (có comment xác nhận)
- `panthora_be/src/Domain/Enums/TransportType.cs` — enum thứ 4 có vẻ dư thừa, cần xem lại có chỗ nào dùng không
- `panthora_be/src/Domain/Entities/VehicleEntity.cs` — fleet của supplier
- `panthora_be/src/Domain/Entities/TourInstanceDayActivityEntity.cs` — activity có đủ fields inline cho External
- `pathora/frontend/src/types/tour.ts` — `TransportationTypeMap`, `VehicleTypeMap`
- `pathora/frontend/src/features/dashboard/components/createTourInstanceAssignments.ts` — nơi gom assignment payload
