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

## 3. Bốn hướng đi đã cân nhắc

| # | Hướng | Ưu | Nhược |
|---|-------|-----|-------|
| **A** | Cắt `TransportationType` xuống còn đúng những gì `VehicleType` phục vụ được (Bus/Car/Minibus/Van/Coach/Motorbike). Bỏ Flight/Boat/Train/Walking/Bicycle khỏi UI | Đơn giản nhất. Hết gãy ngay | Mất tính thật — tour dài ngày vẫn có chặng bay/tàu/ferry |
| **B** | Thêm trường `TransportMode` (Ground/Air/Rail/Sea) lên cả `SupplierEntity` và `VehicleEntity`. Picker giữ nguyên, khi chọn Flight → chỉ lọc supplier khai mode = Air | Giữ được đủ loại hình. Filter đúng ngay | Phải model "vehicle" cho air/rail/sea → `VehicleEntity` hơi gượng (một chiếc máy bay có "biển số"?) |
| **C** | **Tách hai nhánh:** Ground → Supplier + Vehicle (như hiện tại). Air/Rail/Sea → External booking (chỉ lưu reference: số chuyến, hãng, PNR), không cần supplier nội bộ duyệt | Mô hình trung thực với thực tế nghiệp vụ. Giữ `VehicleEntity` sạch | Hai code path khác nhau — UI assignment phức tạp hơn một chút |
| **D** | Giữ nguyên domain, chỉ sửa UI: `TransportationType` picker ở Tour Plan cũng chỉ còn Ground; nếu cần bay/tàu thì Manager tạo activity `Other` với description free-text | Không đụng BE | Mất thông tin cấu trúc (không query được "tour nào có chặng bay") |

**Kết luận:** Chọn hướng **C** — vì đúng với thực tế "nhà cung cấp nhỏ, máy bay/tàu Manager tự book ngoài".

---

## 4. Chi tiết hướng C

### Ý tưởng cốt lõi

Tách hẳn 2 loại "di chuyển" trong hệ thống, vì bản chất nghiệp vụ khác hẳn nhau:

```
┌──────────────────────────────┐      ┌────────────────────────────────┐
│  NHÁNH A: GROUND TRANSPORT   │      │  NHÁNH B: EXTERNAL TRANSPORT   │
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

## 9. Câu hỏi còn lại để chốt scope

Trước khi convert doc này thành OpenSpec proposal chính thức, cần trả lời:

1. **Có cần upload PDF vé không?** → Nếu có thì nghiêng C-đầy đủ; nếu không thì C-gọn là đủ.
2. **Vé máy bay/tàu có cần tính vào tổng chi phí tour không?** → Nếu có, đã có `Price` field dùng được.
3. **Có cần audit "ai đã nhập số chuyến bay này" không?** → Nếu chỉ cần created/modified by là xong, C-gọn đủ.
4. **Manager có cần edit External booking sau khi đã tạo không?** (thay đổi chuyến bay, dời ngày, …) → Nếu có, cần flow edit riêng.
5. **Khi có booking mà cancel tour, có cần hoàn tiền/thông báo gì đặc biệt không?** → Nếu có workflow refund riêng thì cần plan thêm.

---

## 10. Next step đề xuất

1. **Trả lời 5 câu hỏi mục 9** để chốt scope giữa C-gọn và C-đầy đủ.
2. Nếu C-gọn → tạo OpenSpec change `split-ground-vs-external-transport` với:
   - `proposal.md`: mô tả why + what changes
   - `design.md`: chi tiết branching logic, impact lên `CheckAndActivateTourInstance`
   - `tasks.md`: checklist implement (backend handlers, frontend form branching, filter supplier dropdown)
   - `specs/`: nếu có spec modify

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
