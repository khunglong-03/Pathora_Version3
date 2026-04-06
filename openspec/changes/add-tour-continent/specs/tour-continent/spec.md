## ADDED Requirements

### Requirement: Continent enum definition

Hệ thống SHALL cung cấp enum `Continent` với 6 giá trị đại diện cho 6 châu lục trên thế giới. Mỗi giá trị enum sử dụng tên tiếng Anh làm identifier và có `[Description]` attribute chứa tên tiếng Việt để hỗ trợ i18n.

#### Scenario: Continent enum has 6 values
- **WHEN** code references `Continent.Asia`
- **THEN** giá trị là `1` và `[Description]` là `"Châu Á"`
- **WHEN** code references `Continent.Europe`
- **THEN** giá trị là `2` và `[Description]` là `"Châu Âu"`
- **WHEN** code references `Continent.Africa`
- **THEN** giá trị là `3` và `[Description]` là `"Châu Phi"`
- **WHEN** code references `Continent.Americas`
- **THEN** giá trị là `4` và `[Description]` là `"Châu Mỹ"`
- **WHEN** code references `Continent.Oceania`
- **THEN** giá trị là `5` và `[Description]` là `"Châu Đại Dương"`
- **WHEN** code references `Continent.Antarctica`
- **THEN** giá trị là `6` và `[Description]` là `"Châu Nam Cực"`

### Requirement: Tour Continent property

`TourEntity` SHALL có property `Continent` kiểu `Continent?` (nullable). Property này xác định châu lục mà tour hướng đến.

#### Scenario: Tour with Domestic scope has null Continent
- **WHEN** một tour mới được tạo với `TourScope = Domestic`
- **THEN** `Continent` được set là `null`

#### Scenario: Tour with International scope has Continent
- **WHEN** một tour được tạo với `TourScope = International`
- **THEN** `Continent` không được là `null` và phải là một trong 6 giá trị hợp lệ

### Requirement: Continent stored as string in database

`Continent` được lưu trong PostgreSQL dưới dạng `varchar(50) NULL`. Enum được convert sang string tương tự các enum khác trong hệ thống.

#### Scenario: Continent value stored correctly
- **WHEN** một tour có `Continent = Continent.Europe` được lưu
- **THEN** trong database, cột `Continent` chứa giá trị `"Europe"`
- **WHEN** một tour có `Continent = null` được lưu
- **THEN** trong database, cột `Continent` chứa giá trị `NULL`

### Requirement: Continent is optional for Domestic tours

Continent không bắt buộc khi tour có `TourScope = Domestic`. Người dùng có thể tạo/cập nhật tour trong nước mà không cần chọn châu lục.

#### Scenario: Create domestic tour without continent
- **WHEN** tạo tour với `TourScope = Domestic` và `Continent = null`
- **THEN** tour được tạo thành công

#### Scenario: Update domestic tour continent
- **WHEN** cập nhật tour đã tồn tại (Domestic) với `Continent = null`
- **THEN** tour được cập nhật thành công

### Requirement: Continent is required for International tours

Continent bắt buộc phải có giá trị hợp lệ khi tour có `TourScope = International`.

#### Scenario: Create international tour without continent fails
- **WHEN** tạo tour với `TourScope = International` và `Continent = null`
- **THEN** hệ thống trả về lỗi validation yêu cầu chọn châu lục

#### Scenario: Update international tour to null continent fails
- **WHEN** cập nhật tour hiện có (International) với `Continent = null`
- **THEN** hệ thống trả về lỗi validation yêu cầu chọn châu lục
