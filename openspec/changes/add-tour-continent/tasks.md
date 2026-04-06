## 1. Tạo Continent Enum

- [x] 1.1 Tạo file `Domain/Enums/Continent.cs` với 6 giá trị: Asia, Europe, Africa, Americas, Oceania, Antarctica (kèm `[Description]` tiếng Việt)
- [x] 1.2 Build verify: `dotnet build panthora_be/LocalService.slnx`

## 2. Thêm Continent vào TourEntity

- [x] 2.1 Thêm property `public Continent? Continent { get; set; }` vào `TourEntity.cs`
- [x] 2.2 Cập nhật `TourEntity.Create()` factory — set `Continent = null` (default)
- [x] 2.3 Cập nhật `TourEntity.Update()` method — thêm `Continent` parameter
- [x] 2.4 Build verify

## 3. Cập nhật EF Configuration

- [x] 3.1 Thêm config cho `Continent` trong `TourConfiguration.cs`:
  - `.HasConversion<string>()`
  - `.HasMaxLength(50)`
  - `.IsRequired(false)` (nullable)
- [x] 3.2 Build verify

## 4. Tạo EF Migration

- [x] 4.1 Chạy `dotnet ef migrations add AddContinentToTour --project panthora_be/src/Infrastructure --startup-project panthora_be/src/Api`
- [x] 4.2 Review migration file — verify nullable column, correct column name `Continent`, varchar(50)
- [x] 4.3 Apply migration: đã apply SQL trực tiếp vào DB (EF có pre-existing migration lỗi)
- [x] 4.4 Build verify

## 5. Validation

- [x] 5.1 Thêm FluentValidation rule trong validator tương ứng: khi `TourScope = International` → `Continent` không được null
- [x] 5.2 Build verify
- [x] 5.3 Run tests: Domain.Specs project có pre-existing failures (không liên quan đến change này)

## 6. Frontend Types

- [x] 6.1 Thêm `continent?: number` vào `TourDto` (types/tour.ts)
- [x] 6.2 Build verify

## 7. Frontend Form

- [x] 7.1 Thêm continent picker vào BasicInfo section (`TourForm.tsx`)
  - Conditional: chỉ hiện khi `TourScope = "2"` (International)
  - Reset continent về `""` khi chuyển về Domestic
  - 6 options: Asia, Europe, Africa, Americas, Oceania, Antarctica
- [x] 7.2 Cập nhật form payload builder (`tourCreatePayload.ts`)
  - Thêm `continent` vào `BasicInfoPayload` interface
  - Append `continent` vào `FormData` khi có giá trị
- [x] 7.3 Cập nhật initialData loading trong edit mode — continent được load từ `initialData.continent`
- [x] 7.4 Build + lint verify

## 8. Frontend i18n

- [x] 8.1 Thêm labels vào `vi.json` (7 keys: label, placeholder, 6 continents)
- [x] 8.2 Thêm labels vào `en.json` (7 keys: label, placeholder, 6 continents)
- [x] 8.3 Build verify
