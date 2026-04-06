## 1. Backend — Entity & Configuration

- [x] 1.1 Remove `RowVersion` property và `[DatabaseGenerated(DatabaseGeneratedOption.Computed)]` attribute khỏi `TourInstanceEntity.cs` (dòng 57-59)
- [x] 1.2 Remove `xmin`/`RowVersion` configuration khỏi `TourInstanceConfiguration.cs` (dòng 125-130)

## 2. Backend — DTO & Command

- [x] 2.1 Remove `uint RowVersion = 0` parameter khỏi `TourInstanceDto.cs`
- [x] 2.2 Remove `uint? RowVersion = null` parameter khỏi `UpdateTourInstanceCommand.cs`
- [x] 2.3 Remove `RuleFor(x => x.RowVersion).NotNull()` validator rule khỏi `UpdateTourInstanceCommandValidator`

## 3. Backend — Service & Mapping

- [x] 3.1 Remove `entity.RowVersion = request.RowVersion ?? 0;` khỏi `TourInstanceService.Update` (`TourInstanceService.cs:270`)
- [x] 3.2 Remove try-catch block cho `DbUpdateConcurrencyException` khỏi `TourInstanceService.Update` (dòng 272-281)
- [x] 3.3 Remove `RowVersion` mapping khỏi `TourInstanceProfile.cs` (dòng 29)

## 4. Backend — Database Migration

- [x] 4.1 Run `dotnet ef migrations add RemoveTourInstanceXminConcurrencyToken` trong `panthora_be/src/Infrastructure`
- [x] 4.2 Review generated migration — đảm bảo Down() chỉ có `DROP COLUMN xmin FROM "TourInstances"`
- [ ] 4.3 **Run migration thủ công** trên database sau khi code deploy

## 5. Frontend — Type & Service

- [x] 5.1 Remove `rowVersion?: number` khỏi `NormalizedTourInstanceDto` type (`src/types/tour.ts:469`)
- [x] 5.2 Remove `rowVersion?: number` khỏi `UpdateTourInstancePayload` (`src/api/services/tourInstanceService.ts:59`)

## 6. Frontend — Component

- [x] 6.1 Remove `rowVersion: data.rowVersion` khỏi service call payload (`src/api/services/tourInstanceService.ts:224`)
- [x] 6.2 Remove `rowVersion: data.rowVersion` khỏi component payload (`TourInstanceDetailPage.tsx:362`)
- [x] 6.3 Verify không còn `rowVersion` reference nào trong frontend codebase (`grep -r "rowVersion" pathora/frontend/src/`)

## 7. Verification

- [x] 7.1 Backend build: `dotnet build` thành công không có lỗi
- [x] 7.2 Frontend build: `npm run build` thành công không có lỗi
- [ ] 7.3 Manual test: Update tour instance qua UI — verify save succeeds without `xmin`
