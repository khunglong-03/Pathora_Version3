# Admin Portal — Project Tracking

| # | Function / Screen | Feature | Owner | Priority | Est. Effort | Planned | Actual | Status | Notes | Test Report |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `/admin/dashboard` | Dashboard tổng quan — KPIs (users, active, managers, transport providers, hotel providers), recent activities | Admin | P1 | 1d | — | — | Done | KPI strip từ `getDashboardOverview()` API | |
| 2 | `/admin/users` | Danh sách người dùng — filter tabs theo role (Admin/Manager/TourDesigner/TourGuide/TransportProvider/HotelServiceProvider/Customer), search text, KPI strip số lượng theo role, bảng phân trang | Admin | P1 | 1d | — | — | Done | Filter tabs có count từ API, search debounce 300ms | |
| 3 | `/admin/users/[id]` | Chi tiết người dùng — avatar, họ tên, status badge, roles badges (màu theo role), grid thông tin (email, phone, createdAt, lastLogin, address, nationality) | Admin | P1 | 0.5d | — | — | Done | Read-only, back link về `/admin/users` | |
| 4 | `/admin/transport-providers` | Danh sách nhà cung cấp vận tải — KPI strip (tổng, active, pending), filter tabs status (Tất cả/Hoạt động/Ngừng), search, card grid 3 cột, pagination 12/page | Admin | P1 | 1d | — | — | Done | Cards dùng `TransportProviderCard`, link đến detail page | |
| 5 | `/admin/transport-providers/[id]` | Chi tiết nhà cung cấp vận tải — 4 tabs: Overview (supplierCode, taxCode, address, email, phone, createdAt), Vehicles (bảng: biển số, loại xe, số ghế, khu vực, status), Drivers (bảng: họ tên, GPLX, loại GPLX, phone, status), Bookings (placeholder trống) | Admin | P1 | 1d | — | — | Done | KPI strip: vehicles count, drivers count, bookingCount, completedBookingCount | |
| 6 | `/admin/hotel-providers` | Danh sách nhà cung cấp khách sạn — KPI strip, filter tabs status, search, card grid, pagination | Admin | P1 | 1d | — | — | Done | Cards dùng `HotelProviderCard` | |
| 7 | `/admin/tour-managers` | Quản lý Tour Manager — master-detail layout: left panel (danh sách manager, select → hiện staff bên phải), action buttons (+ Gán Designer, + Gán Guide, + Tạo nhân viên), 3 modals (StaffReassignModal, AssignExistingModal, CreateStaffModal) | Admin | P1 | 2d | — | — | Done | Phức tạp nhất — 3 modal + master-detail state | |
| 8 | `/admin/tour-managers/create` | Tạo Tour Manager — step 1: tạo tài khoản (email + fullName), step 2: assign TourDesigner + TourGuide từ dropdown tìm kiếm, gán vai trò trong nhóm (Trưởng nhóm/Thành viên) | Admin | P1 | 1d | — | — | Done | 2 bước: tạo → assign | |
| 9 | `/admin/tour-managers/[id]/edit` | Chỉnh sửa Tour Manager — load thông tin hiện tại, thêm/bớt TourDesigner + TourGuide, lưu thay đổi (bulk assign + xóa assignment), hiển thị số Designer/Guide | Admin | P1 | 1d | — | — | Done | bulkAssign replaces all, xử lý remove riêng | |
| 10 | `/admin/tour-managers/[id]/staff` | Danh sách nhân viên Tour Manager — hiển thị nhân viên dưới manager, badge số Designer/Guide, reassign modal | Admin | P2 | 0.5d | — | — | Done | Reuses `StaffList` component + `StaffReassignModal` | |
| 11 | BE: RoleId verification | Xác minh DB seed RoleId TransportProvider=6, HotelServiceProvider=7 trùng với handler code | Backend | P1 | 0.5d | — | — | Done | DB role.json xác nhận 6/7 đúng, handlers dùng 6/7 đúng — không cần fix | |
| 12 | `GeographicChip` component | Component badge tái sử dụng — hiển thị continent (emoji + tên VN) hoặc country (flag + tên) | Admin | P2 | 0.5d | — | — | New | Dùng trên cả TransportProviderCard và HotelProviderCard | |
| 13 | TransportProviderCard — geographic chips | Hiển thị continent chips trên card nhà cung cấp vận tải (nền teal), placeholder "Chưa có thông tin" nếu không có vehicle | Admin | P2 | 0.5d | — | — | New | Tính từ vehicle records, cần API trả `operatingContinents` | |
| 14 | HotelProviderCard — geographic chips | Hiển thị continent + country chips trên card nhà cung cấp khách sạn (nền orange) | Admin | P2 | 0.5d | — | — | New | Tính từ accommodation records | |
| 15 | `/admin/transport-providers` — continent filter | Thêm continent dropdown + country filter, URL state sync (query params) | Admin | P2 | 1d | — | — | New | Kết hợp được với status filter + search hiện tại | |
| 16 | `/admin/hotel-providers` — continent filter | Thêm continent dropdown + country filter, URL state sync | Admin | P2 | 1d | — | — | New | Kết hợp được với status filter + search hiện tại | |
| 17 | `src/utils/continentUtils.ts` | Map Continent enum → Vietnamese name + emoji | Admin | P3 | 0.25d | — | — | New | Asia→"🌏 Châu Á", Europe→"🌍 Châu Âu", etc. | |
| 18 | `src/utils/countryUtils.ts` | Map ISO alpha-2 → country name (VN→"Việt Nam", TH→"Thái Lan") | Admin | P3 | 0.25d | — | — | New | | |
| 19 | `src/data/countries.ts` | Static map ISO alpha-2 → country names | Admin | P3 | 0.25d | — | — | New | | |
| 20 | `src/data/continents.ts` | Static Continent enum → metadata (name, emoji, countries list) | Admin | P3 | 0.25d | — | — | New | | |
| 21 | BE: Transport provider geographic API | Params `continent` + `country` vào `GetTransportProvidersQuery`, join User→VehicleEntity, update `TransportProviderListItemDto` với `operatingContinents` + `operatingCountries` | Backend | P2 | 1d | — | — | New | | |
| 22 | BE: Hotel provider geographic API | Params `continent` + `country` vào `GetHotelProvidersQuery`, join qua Supplier→HotelRoomInventory, update `HotelProviderListItemDto` | Backend | P2 | 1d | — | — | New | | |
| 23 | FE: adminService types update | Cập nhật `TransportProviderListItem` + `HotelProviderListItem` types với `operatingContinents` + `operatingCountries` | Admin | P2 | 0.5d | — | — | New | | |
| 24 | IT: Admin geographic filter | Filter by continent trên admin list — verify chỉ hiện matching providers | QA | P2 | 0.5d | — | — | New | | |
| 25 | IT: Combined filters | Test kết hợp status + search + continent + country trên cả 2 admin list pages | QA | P2 | 0.5d | — | — | New | | |
| 26 | IT: Existing admin regression | Verify user list, tour managers, dashboard không bị ảnh hưởng | QA | P1 | 0.5d | — | — | New | | |

---

## Summary

| Trạng thái | Số mục | % |
|---|---|---|
| Done | 11 | 42% |
| New | 15 | 58% |
| **Tổng** | **26** | **100%** |

| Priority | Số mục |
|---|---|
| P1 | 13 |
| P2 | 10 |
| P3 | 4 |

| Phân nhóm | Done | New |
|---|---|---|
| Admin Pages | 10 | 0 |
| Backend (Bug + APIs) | 1 | 2 |
| Admin Geographic Features (Cards) | 0 | 3 |
| Admin Geographic Features (Filters) | 0 | 2 |
| Continent/Country Utilities | 0 | 4 |
| Frontend Types | 0 | 1 |
| Integration Testing | 0 | 3 |
