## 1. Backend — Add Query

- [x] 1.1 Add `AdminBookingListResponse` DTO to `src/Application/Contracts/Booking/BookingManagementDtos.cs`
  ```csharp
  public sealed record AdminBookingListResponse(
      Guid Id,
      string CustomerName,
      string TourName,
      DateTimeOffset DepartureDate,
      decimal TotalPrice,
      string Status
  );

  public sealed record AdminBookingListResult(
      List<AdminBookingListResponse> Items,
      int TotalCount
  );
  ```

- [x] 1.2 Add `GetAllPagedAsync(int page, int pageSize)` to `IBookingRepository` interface (`src/Domain/Common/Repositories/IBookingRepository.cs`)

- [x] 1.3 Implement `GetAllPagedAsync` in `BookingRepository` (`src/Infrastructure/Repositories/BookingRepository.cs`)
  - Include `TourInstance` navigation
  - Use `.AsNoTracking()` (consistent with existing repo methods)
  - Order by `BookingDate` descending
  - Skip/take for pagination
  - Return `(List<BookingEntity>, int totalCount)`

- [x] 1.4 Create `GetAllBookingsQuery.cs` in `src/Application/Features/BookingManagement/Queries/`
  ```csharp
  public sealed record GetAllBookingsQuery(int Page = 1, int PageSize = 20)
      : IQuery<ErrorOr<AdminBookingListResult>>;
  ```

- [x] 1.5 Create `GetAllBookingsQueryHandler.cs` in `src/Application/Features/BookingManagement/Queries/`
  - Inject `IBookingRepository`
  - Cap `pageSize` at 100: `pageSize = Math.Min(request.PageSize, 100)`
  - Call `GetAllPagedAsync(page, pageSize)`
  - Project entities to `AdminBookingListResponse`
  - Return `AdminBookingListResult`

## 2. Backend — Add Controller Endpoint

- [x] 2.1 Add `HttpGet` method to `BookingManagementController.cs`
  ```csharp
  [HttpGet]
  public async Task<IActionResult> GetAllBookings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
  {
      var result = await Sender.Send(new GetAllBookingsQuery(page, pageSize));
      return HandleResult(result);
  }
  ```

## 3. Backend — Add Tests (from Eng Review)

- [x] 3.1 Create `GetAllBookingsQueryTests.cs` — test default page/pageSize, cap enforcement
- [x] 3.2 Create `GetAllBookingsQueryHandlerTests.cs` — test field projection (TourName, CustomerName, Status, DepartureDate, TotalPrice), empty list handling
- [x] 3.3 Create `BookingRepositoryGetAllPagedAsyncTests.cs` — test pagination (skip/take), totalCount accuracy, ordering (BookingDate desc)

## 4. Verify

- [ ] 4.1 Run backend and test `GET http://localhost:5182/api/bookings` (with auth token) — expect 200 with `{ items: [...], totalCount: N }`
- [ ] 4.2 Navigate to `/dashboard/bookings` in browser — expect bookings table to populate
- [ ] 4.3 Verify the 404 error is gone from browser console
- [ ] 4.4 Run unit tests — all pass
