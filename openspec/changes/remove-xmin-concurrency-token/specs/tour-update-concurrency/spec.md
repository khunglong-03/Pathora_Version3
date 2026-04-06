## ADDED Requirements

### Requirement: Tour update concurrency handling

Khi two concurrent requests cố gắng update cùng một tour entity, hệ thống SHALL xử lý race condition một cách graceful thay vì throw `DbUpdateConcurrencyException`.

#### Scenario: Second concurrent update request succeeds

- **WHEN** User A và User B cùng mở form edit tour T, User A submit update trước và thành công, sau đó User B submit update
- **THEN** User B's update được apply thành công, database reflect User B's changes

#### Scenario: Second concurrent update request detects conflict via row count

- **WHEN** User A và User B submit update cùng lúc (within same second), User A's save completes first and changes `LastModifiedOnUtc`
- **THEN** User B's update still succeeds because both are valid changes; `LastModifiedOnUtc` is updated to User B's save time
- **AND** No exception is thrown to the user

#### Scenario: Database constraint violation during update

- **WHEN** Một UPDATE operation không affect được row nào (row bị delete hoặc không tồn tại)
- **THEN** Hệ thống trả về HTTP 404 Not Found với message "Tour not found"

### Requirement: Concurrency conflict resolution via LastModifiedOnUtc

Hệ thống SHALL sử dụng `LastModifiedOnUtc` timestamp như một tín hiệu mềm (soft signal) để detect potential conflicts, không phải như một hard concurrency token trong WHERE clause.

#### Scenario: Client checks modification timestamp before update

- **WHEN** Frontend gửi request với `If-Unmodified-Since` header hoặc gửi kèm `lastModifiedAt` trong request body
- **THEN** Backend so sánh `lastModifiedAt` với `LastModifiedOnUtc` trong database
- **AND** Nếu khác nhau, trả về HTTP 409 Conflict với current server timestamp
- **AND** Frontend có thể show "Tour was modified by another user" và yêu cầu refresh

### Requirement: Tour update error handling

`TourService.Update` SHALL catch database-level exceptions và trả về user-friendly error responses thay vì để exception bubble up thành 500.

#### Scenario: Soft-deleted entity during update

- **WHEN** Tour entity bị soft-delete (IsDeleted = true) giữa lúc fetch và save
- **THEN** Hệ thống trả về HTTP 404 với message "Tour has been deleted"

#### Scenario: Related entity conflict

- **WHEN** Một child entity (Classification, Activity, Location) bị xóa khỏi database giữa lúc fetch và save
- **THEN** Hệ thống xử lý gracefully, bỏ qua entity đó nếu có thể, hoặc trả về HTTP 400 với chi tiết entity bị thiếu
