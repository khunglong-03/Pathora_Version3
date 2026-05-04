-- =====================================================================
-- Seed data: TourGuide complete-tour flow test
-- TourInstance: 019defe0-6c8d-7018-813c-096163b6902e
-- Pre-existing IDs (user-provided):
--   TourGuide:        019def98-6c7a-7e56-94e1-489169f21e68
--   Customer:         019defa0-e9db-7abe-957a-388fbe4fc207
--   TourOperator:     019def98-028c-7783-8f2a-4983911077a2
--   Manager:          019def97-9441-79ca-8786-b4a75614a9e0
--   TransportSupplier:019def96-284d-7fcc-861d-4708fb814c28
--   HotelSupplier:    019def96-f614-7f1c-a363-291bb62a5c2d
-- Image fallback:
--   https://res.cloudinary.com/dwa0kngte/image/upload/v1777841784/panthora/f35174d0-a2f5-4b6c-8e49-ac1731426146.jpeg.jpg
--
-- USAGE:
--   psql -d <db> -f seed/test-tour-completion-flow.sql
-- Hoặc copy nội dung paste vào pgAdmin / DBeaver.
--
-- IDEMPOTENT: dùng ON CONFLICT DO NOTHING ở đa số INSERT.
-- ROLLBACK: xem cuối file (commented out).
-- =====================================================================

DO $$
BEGIN

-- ---------------------------------------------------------------------
-- XÓA DỮ LIỆU CŨ NẾU CÓ ĐỂ TRÁNH TRÙNG LẶP (CLEANUP)
-- ---------------------------------------------------------------------
DELETE FROM "TourDayActivityStatuses" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "CustomerPayments" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "CustomerDeposits" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "BookingTourGuides" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "BookingAccommodationDetails" WHERE "BookingActivityReservationId" IN
  (SELECT "Id" FROM "BookingActivityReservations" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e'));
DELETE FROM "BookingTransportDetails" WHERE "BookingActivityReservationId" IN
  (SELECT "Id" FROM "BookingActivityReservations" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e'));
DELETE FROM "BookingActivityReservations" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "BookingParticipants" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "RoomBlocks" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "PaymentTransactions" WHERE "BookingId" IN (SELECT "Id" FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "Bookings" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e';

DELETE FROM "VehicleBlocks" WHERE "TourInstanceDayActivityId" IN (SELECT "Id" FROM "TourInstanceDayActivities" WHERE "TourInstanceDayId" IN (SELECT "Id" FROM "TourInstanceDays" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e'));
DELETE FROM "TourInstanceDayActivities" WHERE "TourInstanceDayId" IN (SELECT "Id" FROM "TourInstanceDays" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e');
DELETE FROM "TourInstanceDays" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e';
DELETE FROM "tour_manager_assignment" WHERE "AssignedTourId"='019defe0-6c8d-7018-813c-096163b6902e';
DELETE FROM "TourInstances" WHERE "Id"='019defe0-6c8d-7018-813c-096163b6902e';

-- ---------------------------------------------------------------------
-- -1. Suppliers (master data)
-- ---------------------------------------------------------------------
INSERT INTO "Suppliers" (
    "Id", "SupplierCode", "SupplierType", "Name", "Phone", "Email", "Address", "Note", 
    "IsActive", "IsDeleted", "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES 
    ('019def96-284d-7fcc-861d-4708fb814c28', 'SUP-TRANS-1', 1, 'Transport Supplier Test', '0123456789', 'transport@test.com', 'Hanoi', 'Seed data', true, false, NOW(), 'system', NOW(), 'system'),
    ('019def96-f614-7f1c-a363-291bb62a5c2d', 'SUP-HOTEL-1', 2, 'Hotel Supplier Test', '0123456789', 'hotel@test.com', 'Hanoi', 'Seed data', true, false, NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 0. Vehicle + HotelRoomInventory (master data cho 2 supplier)
-- ---------------------------------------------------------------------
INSERT INTO "Vehicles" (
    "Id", "VehicleType", "Brand", "Model", "SeatCapacity", "Quantity",
    "LocationArea", "OperatingCountries", "VehicleImageUrls",
    "OwnerId", "SupplierId", "IsActive", "IsDeleted", "Notes",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0007-7000-0000-000000000001',
    'Minibus', 'Hyundai', 'Solati', 16, 1,
    'Domestic', 'VN',
    '["https://res.cloudinary.com/dwa0kngte/image/upload/v1777841784/panthora/f35174d0-a2f5-4b6c-8e49-ac1731426146.jpeg.jpg"]'::jsonb,
    '019def96-284d-7fcc-861d-4708fb814c28',  -- Transport supplier owner
    '019def96-284d-7fcc-861d-4708fb814c28',
    true, false, 'Seed test vehicle',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "HotelRoomInventory" (
    "Id", "SupplierId", "RoomType", "TotalRooms",
    "Name", "Address", "LocationArea", "OperatingCountries",
    "Thumbnail_FileId", "Thumbnail_OriginalFileName", "Thumbnail_FileName", "Thumbnail_PublicURL",
    "Notes", "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0008-7000-0000-000000000001',
    '019def96-f614-7f1c-a363-291bb62a5c2d',  -- Hotel supplier
    'Double', 10,
    'Seed Hotel Room', 'Hà Nội', 'Domestic', 'VN',
    NULL, NULL, NULL,
    'https://res.cloudinary.com/dwa0kngte/image/upload/v1777841784/panthora/f35174d0-a2f5-4b6c-8e49-ac1731426146.jpeg.jpg',
    'Seed test room', NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 1. Tour template
-- ---------------------------------------------------------------------
INSERT INTO "Tours" (
    "Id", "TourCode", "TourName", "ShortDescription", "LongDescription",
    "IsDeleted", "Status", "TourScope", "IsVisa", "CustomerSegment",
    "Thumbnail_FileId", "Thumbnail_OriginalFileName", "Thumbnail_FileName", "Thumbnail_PublicURL",
    "Translations", "TourOperatorId",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0001-7000-0000-000000000001',
    'TOUR-SEED-001',
    'Seed Tour Hà Nội 2N1Đ',
    'Tour seed test cho luồng kết thúc chuyến đi',
    'Tour 2 ngày 1 đêm, có vận chuyển + lưu trú',
    false, 'Active', 'Domestic', false, 'Group',
    NULL, NULL, NULL,
    'https://res.cloudinary.com/dwa0kngte/image/upload/v1777841784/panthora/f35174d0-a2f5-4b6c-8e49-ac1731426146.jpeg.jpg',
    '{"vi":{"name":"Tour Hà Nội 2N1Đ"},"en":{"name":"Hanoi 2D1N Tour"}}'::jsonb,
    '019def98-028c-7783-8f2a-4983911077a2',  -- TourOperator
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "TourClassifications" (
    "Id", "TourId", "Name", "BasePrice", "Description",
    "NumberOfDay", "NumberOfNight", "IsDeleted",
    "Translations",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0002-7000-0000-000000000001',
    '019df000-0001-7000-0000-000000000001',
    'Standard', 2000000, 'Standard 2N1Đ',
    2, 1, false,
    '{"vi":{"name":"Tiêu chuẩn"},"en":{"name":"Standard"}}'::jsonb,
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- 2 TourDays
INSERT INTO "TourDays" (
    "Id", "ClassificationId", "DayNumber", "Title", "Description",
    "IsDeleted", "Translations",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-0003-7000-0000-000000000001',
     '019df000-0002-7000-0000-000000000001',
     1, 'Ngày 1: Đón khách + tham quan', 'Khởi hành sáng',
     false, '{"vi":{"title":"Ngày 1"},"en":{"title":"Day 1"}}'::jsonb,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0003-7000-0000-000000000002',
     '019df000-0002-7000-0000-000000000001',
     2, 'Ngày 2: Tham quan + về', 'Trả khách chiều',
     false, '{"vi":{"title":"Ngày 2"},"en":{"title":"Day 2"}}'::jsonb,
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- 5 TourDayActivities (Day1: Sight + Transport + Hotel; Day2: Sight + Transport)
INSERT INTO "TourDayActivities" (
    "Id", "TourDayId", "Order", "ActivityType", "Title", "Description",
    "IsOptional", "IsDeleted", "Translations", "Price",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-0004-7000-0000-000000000001',
     '019df000-0003-7000-0000-000000000001', 1, 'Sightseeing',
     'Tham quan Hồ Hoàn Kiếm', 'Đi bộ tham quan',
     false, false, '{"vi":{},"en":{}}'::jsonb, 0,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0004-7000-0000-000000000002',
     '019df000-0003-7000-0000-000000000001', 2, 'Transportation',
     'Xe đón khách', 'Xe Minibus 16 chỗ',
     false, false, '{"vi":{},"en":{}}'::jsonb, 500000,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0004-7000-0000-000000000003',
     '019df000-0003-7000-0000-000000000001', 3, 'Accommodation',
     'Lưu trú khách sạn', 'Phòng Double',
     false, false, '{"vi":{},"en":{}}'::jsonb, 800000,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0004-7000-0000-000000000004',
     '019df000-0003-7000-0000-000000000002', 1, 'Sightseeing',
     'Tham quan Văn Miếu', 'Đi bộ tham quan',
     false, false, '{"vi":{},"en":{}}'::jsonb, 0,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0004-7000-0000-000000000005',
     '019df000-0003-7000-0000-000000000002', 2, 'Transportation',
     'Xe trả khách', 'Xe Minibus 16 chỗ',
     false, false, '{"vi":{},"en":{}}'::jsonb, 500000,
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. TourInstance (id chỉ định + Status = InProgress)
-- ---------------------------------------------------------------------
INSERT INTO "TourInstances" (
    "Id", "TourId", "ClassificationId",
    "TourInstanceCode", "Title", "TourName", "TourCode", "ClassificationName",
    "InstanceType", "Status", "WantsCustomization",
    "StartDate", "EndDate", "DurationDays", "ConfirmationDeadline",
    "MaxParticipation", "CurrentParticipation",
    "BasePrice", "Location",
    "Thumbnail_PublicURL",
    "IncludedServices", "IsDeleted", "RowVersion", "Translations",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019defe0-6c8d-7018-813c-096163b6902e',
    '019df000-0001-7000-0000-000000000001',
    '019df000-0002-7000-0000-000000000001',
    'TI-SEED-001', 'Seed Instance Hà Nội', 'Seed Tour Hà Nội 2N1Đ',
    'TOUR-SEED-001', 'Standard',
    'Public', 'InProgress', false,
    (CURRENT_DATE - INTERVAL '1 day')::date::timestamptz,
    (CURRENT_DATE + INTERVAL '1 day')::date::timestamptz,
    2,
    (CURRENT_DATE - INTERVAL '7 days')::date::timestamptz,
    10, 2,
    2000000, 'Hà Nội',
    'https://res.cloudinary.com/dwa0kngte/image/upload/v1777841784/panthora/f35174d0-a2f5-4b6c-8e49-ac1731426146.jpeg.jpg',
    '[]'::jsonb, false, '\x00'::bytea,
    '{"vi":{},"en":{}}'::jsonb,
    NOW() - INTERVAL '14 days', 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- TourInstanceDays
INSERT INTO "TourInstanceDays" (
    "Id", "TourInstanceId", "TourDayId", "InstanceDayNumber",
    "ActualDate", "Title",
    "IsDeleted", "Translations",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-0005-7000-0000-000000000001',
     '019defe0-6c8d-7018-813c-096163b6902e',
     '019df000-0003-7000-0000-000000000001', 1,
     (CURRENT_DATE - INTERVAL '1 day')::date,
     'Ngày 1: Đón khách + tham quan',
     false, '{"vi":{},"en":{}}'::jsonb,
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0005-7000-0000-000000000002',
     '019defe0-6c8d-7018-813c-096163b6902e',
     '019df000-0003-7000-0000-000000000002', 2,
     CURRENT_DATE,
     'Ngày 2: Tham quan + về',
     false, '{"vi":{},"en":{}}'::jsonb,
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- TourInstanceDayActivities (5 records, transport+hotel approved=2)
INSERT INTO "TourInstanceDayActivities" (
    "Id", "TourInstanceDayId", "Order", "ActivityType", "Title",
    "IsOptional", "Price",
    "TransportationType", "TransportationName",
    "RequestedSeatCount", "RequestedVehicleCount",
    "TransportSupplierId", "VehicleId", "DriverId",
    "PickupLocation", "DropoffLocation",
    "DepartureTime", "ArrivalTime",
    "TransportationApprovalStatus", "ExternalTransportConfirmed",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    -- Day 1 Sightseeing (no supplier)
    ('019df000-0006-7000-0000-000000000001',
     '019df000-0005-7000-0000-000000000001', 1, 'Sightseeing',
     'Tham quan Hồ Hoàn Kiếm',
     false, 0, NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     0, false,
     NOW(), 'system', NOW(), 'system'),
    -- Day 1 Transportation (supplier + vehicle, Approved=2)
    ('019df000-0006-7000-0000-000000000002',
     '019df000-0005-7000-0000-000000000001', 2, 'Transportation',
     'Xe đón khách',
     false, 500000, 'Bus', 'Minibus 16 chỗ', 16, 1,
     '019def96-284d-7fcc-861d-4708fb814c28',
     '019df000-0007-7000-0000-000000000001',
     NULL,
     'Hà Nội', 'Hà Nội',
     (CURRENT_DATE - INTERVAL '1 day' + TIME '07:00')::timestamptz,
     (CURRENT_DATE - INTERVAL '1 day' + TIME '09:00')::timestamptz,
     2, false,
     NOW(), 'system', NOW(), 'system'),
    -- Day 1 Accommodation
    ('019df000-0006-7000-0000-000000000003',
     '019df000-0005-7000-0000-000000000001', 3, 'Accommodation',
     'Khách sạn Hà Nội',
     false, 800000, NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     0, false,
     NOW(), 'system', NOW(), 'system'),
    -- Day 2 Sightseeing
    ('019df000-0006-7000-0000-000000000004',
     '019df000-0005-7000-0000-000000000002', 1, 'Sightseeing',
     'Tham quan Văn Miếu',
     false, 0, NULL, NULL, NULL, NULL,
     NULL, NULL, NULL, NULL, NULL, NULL, NULL,
     0, false,
     NOW(), 'system', NOW(), 'system'),
    -- Day 2 Transportation (return, Approved=2)
    ('019df000-0006-7000-0000-000000000005',
     '019df000-0005-7000-0000-000000000002', 2, 'Transportation',
     'Xe trả khách',
     false, 500000, 'Bus', 'Minibus 16 chỗ', 16, 1,
     '019def96-284d-7fcc-861d-4708fb814c28',
     '019df000-0007-7000-0000-000000000001',
     NULL,
     'Hà Nội', 'Hà Nội',
     (CURRENT_DATE + TIME '15:00')::timestamptz,
     (CURRENT_DATE + TIME '17:00')::timestamptz,
     2, false,
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- Manager assignment cho instance
INSERT INTO "tour_manager_assignment" (
    "Id", "TourManagerId", "AssignedEntityType", "AssignedTourId",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0013-7000-0000-000000000001',
    '019def97-9441-79ca-8786-b4a75614a9e0',  -- Manager
    'TourInstance',
    '019defe0-6c8d-7018-813c-096163b6902e',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Blocks (xe + phòng) — đây là cái user kỳ vọng "trở về trống" sau Completed
-- ---------------------------------------------------------------------
INSERT INTO "VehicleBlocks" (
    "Id", "VehicleId", "TourInstanceDayActivityId", "BlockedDate",
    "HoldStatus",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-0010-7000-0000-000000000001',
     '019df000-0007-7000-0000-000000000001',
     '019df000-0006-7000-0000-000000000002',
     (CURRENT_DATE - INTERVAL '1 day')::date,
     1,  -- Hard hold
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0010-7000-0000-000000000002',
     '019df000-0007-7000-0000-000000000001',
     '019df000-0006-7000-0000-000000000005',
     CURRENT_DATE,
     1,
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "RoomBlocks" (
    "Id", "SupplierId", "RoomType",
    "BookingId", "TourInstanceDayActivityId",
    "BlockedDate", "RoomCountBlocked", "HoldStatus",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0011-7000-0000-000000000001',
    '019def96-f614-7f1c-a363-291bb62a5c2d',
    'Double',
    '019df000-0009-7000-0000-000000000001',  -- Booking (insert dưới)
    '019df000-0006-7000-0000-000000000003',
    (CURRENT_DATE - INTERVAL '1 day')::date,
    1, 1,  -- Hard hold
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. Booking + Participants + Payments
-- ---------------------------------------------------------------------
INSERT INTO "Bookings" (
    "Id", "TourInstanceId", "UserId",
    "CustomerName", "CustomerPhone", "CustomerEmail",
    "NumberAdult", "NumberChild", "NumberInfant",
    "TotalPrice", "PaymentMethod", "IsFullPay", "VisaServiceFeeTotal",
    "BookingType", "Status", "BookingDate",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0009-7000-0000-000000000001',
    '019defe0-6c8d-7018-813c-096163b6902e',
    '019defa0-e9db-7abe-957a-388fbe4fc207',
    'Khách Test', '0900000001', 'test@example.com',
    2, 0, 0,
    4000000, 'BankTransfer', true, 0,
    'InstanceJoin', 'Paid',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days', 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "BookingParticipants" (
    "Id", "BookingId", "ParticipantType", "FullName", "Status",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-000a-7000-0000-000000000001',
     '019df000-0009-7000-0000-000000000001', 'Adult', 'Nguyễn Văn A', 'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000a-7000-0000-000000000002',
     '019df000-0009-7000-0000-000000000001', 'Adult', 'Trần Thị B', 'Confirmed',
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- BookingActivityReservations (1 per activity)
INSERT INTO "BookingActivityReservations" (
    "Id", "BookingId", "SupplierId", "Order", "ActivityType", "Title",
    "TotalServicePrice", "TotalServicePriceAfterTax", "Status",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-000b-7000-0000-000000000001',
     '019df000-0009-7000-0000-000000000001', NULL, 1, 'Sightseeing',
     'Tham quan Hồ Hoàn Kiếm', 0, 0, 'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000b-7000-0000-000000000002',
     '019df000-0009-7000-0000-000000000001',
     '019def96-284d-7fcc-861d-4708fb814c28', 2, 'Transportation',
     'Xe đón khách', 500000, 500000, 'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000b-7000-0000-000000000003',
     '019df000-0009-7000-0000-000000000001',
     '019def96-f614-7f1c-a363-291bb62a5c2d', 3, 'Accommodation',
     'Khách sạn Hà Nội', 800000, 800000, 'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000b-7000-0000-000000000004',
     '019df000-0009-7000-0000-000000000001', NULL, 4, 'Sightseeing',
     'Tham quan Văn Miếu', 0, 0, 'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000b-7000-0000-000000000005',
     '019df000-0009-7000-0000-000000000001',
     '019def96-284d-7fcc-861d-4708fb814c28', 5, 'Transportation',
     'Xe trả khách', 500000, 500000, 'Confirmed',
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- BookingTransportDetails (cho 2 transport activity)
INSERT INTO "BookingTransportDetails" (
    "Id", "BookingActivityReservationId", "SupplierId",
    "TransportType", "DepartureAt", "ArrivalAt",
    "SeatCapacity", "BuyPrice", "TaxRate", "TotalBuyPrice", "IsTaxable",
    "Status",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-000c-7000-0000-000000000001',
     '019df000-000b-7000-0000-000000000002',
     '019def96-284d-7fcc-861d-4708fb814c28',
     'Bus',
     (CURRENT_DATE - INTERVAL '1 day' + TIME '07:00')::timestamptz,
     (CURRENT_DATE - INTERVAL '1 day' + TIME '09:00')::timestamptz,
     16, 500000, 0, 500000, false,
     'Confirmed',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-000c-7000-0000-000000000002',
     '019df000-000b-7000-0000-000000000005',
     '019def96-284d-7fcc-861d-4708fb814c28',
     'Bus',
     (CURRENT_DATE + TIME '15:00')::timestamptz,
     (CURRENT_DATE + TIME '17:00')::timestamptz,
     16, 500000, 0, 500000, false,
     'Confirmed',
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

-- BookingAccommodationDetails (cho hotel activity)
INSERT INTO "BookingAccommodationDetails" (
    "Id", "BookingActivityReservationId", "SupplierId",
    "AccommodationName", "RoomType", "RoomCount",
    "CheckInAt", "CheckOutAt",
    "BuyPrice", "TaxRate", "TotalBuyPrice", "IsTaxable",
    "Status",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-000d-7000-0000-000000000001',
    '019df000-000b-7000-0000-000000000003',
    '019def96-f614-7f1c-a363-291bb62a5c2d',
    'Khách sạn Hà Nội', 'Double', 1,
    (CURRENT_DATE - INTERVAL '1 day' + TIME '14:00')::timestamptz,
    (CURRENT_DATE + TIME '12:00')::timestamptz,
    800000, 0, 800000, false,
    'Confirmed',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- BookingTourGuide (gắn TourGuide vào booking — quyền truy cập)
INSERT INTO "BookingTourGuides" (
    "Id", "BookingId", "UserId", "AssignedRole", "IsLead",
    "AssignedDate", "AssignedBy", "Status",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-000e-7000-0000-000000000001',
    '019df000-0009-7000-0000-000000000001',
    '019def98-6c7a-7e56-94e1-489169f21e68',  -- TourGuide
    'Lead', true,
    NOW() - INTERVAL '7 days',
    '019def97-9441-79ca-8786-b4a75614a9e0',  -- Manager assigned
    'Confirmed',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- CustomerDeposit + Payment (Status=Success → paidAmount=4000000)
INSERT INTO "CustomerDeposits" (
    "Id", "BookingId", "DepositOrder", "ExpectedAmount", "DueAt", "Status", "PaidAt",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-000f-7000-0000-000000000001',
    '019df000-0009-7000-0000-000000000001',
    1, 4000000,
    NOW() - INTERVAL '5 days',
    'Success',
    NOW() - INTERVAL '5 days',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "CustomerPayments" (
    "Id", "BookingId", "CustomerDepositId",
    "Amount", "PaymentMethod", "TransactionRef", "PaidAt",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES (
    '019df000-0010-7000-0000-00000000000a',
    '019df000-0009-7000-0000-000000000001',
    '019df000-000f-7000-0000-000000000001',
    4000000, 'BankTransfer', 'SEED-TXN-001',
    NOW() - INTERVAL '5 days',
    NOW(), 'system', NOW(), 'system'
) ON CONFLICT ("Id") DO NOTHING;

-- ---------------------------------------------------------------------
-- 5. TourDayActivityStatus (state ban đầu = NotStarted, để guide test Start → Complete)
-- ---------------------------------------------------------------------
INSERT INTO "TourDayActivityStatuses" (
    "Id", "BookingId", "TourDayId", "ActivityStatus",
    "CreatedOnUtc", "CreatedBy", "LastModifiedOnUtc", "LastModifiedBy"
) VALUES
    ('019df000-0012-7000-0000-000000000001',
     '019df000-0009-7000-0000-000000000001',
     '019df000-0003-7000-0000-000000000001',
     'NotStarted',
     NOW(), 'system', NOW(), 'system'),
    ('019df000-0012-7000-0000-000000000002',
     '019df000-0009-7000-0000-000000000001',
     '019df000-0003-7000-0000-000000000002',
     'NotStarted',
     NOW(), 'system', NOW(), 'system')
ON CONFLICT ("Id") DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Lỗi khi chạy seed: %', SQLERRM;
END $$;

-- =====================================================================
-- VERIFICATION QUERIES (chạy sau seed)
-- =====================================================================
-- SELECT "Id","Status","StartDate","EndDate","CurrentParticipation","MaxParticipation"
-- FROM "TourInstances" WHERE "Id"='019defe0-6c8d-7018-813c-096163b6902e';
--
-- SELECT b."Id", b."Status", b."CustomerName", btg."UserId" AS "TourGuideId"
-- FROM "Bookings" b
-- LEFT JOIN "BookingTourGuides" btg ON btg."BookingId"=b."Id"
-- WHERE b."TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e';
--
-- SELECT * FROM "VehicleBlocks" WHERE "TourInstanceDayActivityId" IN (
--   SELECT "Id" FROM "TourInstanceDayActivities" WHERE "TourInstanceDayId" IN (
--     SELECT "Id" FROM "TourInstanceDays" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e'));
--
-- SELECT * FROM "RoomBlocks" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
--
-- SELECT * FROM "TourDayActivityStatuses" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';

-- =====================================================================
-- ROLLBACK (uncomment để xóa toàn bộ seed)
-- =====================================================================
-- BEGIN;
-- DELETE FROM "TourDayActivityStatuses" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "CustomerPayments" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "CustomerDeposits" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "BookingTourGuides" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "BookingAccommodationDetails" WHERE "BookingActivityReservationId" IN
--   (SELECT "Id" FROM "BookingActivityReservations" WHERE "BookingId"='019df000-0009-7000-0000-000000000001');
-- DELETE FROM "BookingTransportDetails" WHERE "BookingActivityReservationId" IN
--   (SELECT "Id" FROM "BookingActivityReservations" WHERE "BookingId"='019df000-0009-7000-0000-000000000001');
-- DELETE FROM "BookingActivityReservations" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "BookingParticipants" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "Bookings" WHERE "Id"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "RoomBlocks" WHERE "BookingId"='019df000-0009-7000-0000-000000000001';
-- DELETE FROM "VehicleBlocks" WHERE "Id" IN
--   ('019df000-0010-7000-0000-000000000001','019df000-0010-7000-0000-000000000002');
-- DELETE FROM "tour_manager_assignment" WHERE "AssignedTourId"='019defe0-6c8d-7018-813c-096163b6902e';
-- DELETE FROM "TourInstanceDayActivities" WHERE "TourInstanceDayId" IN
--   ('019df000-0005-7000-0000-000000000001','019df000-0005-7000-0000-000000000002');
-- DELETE FROM "TourInstanceDays" WHERE "TourInstanceId"='019defe0-6c8d-7018-813c-096163b6902e';
-- DELETE FROM "TourInstances" WHERE "Id"='019defe0-6c8d-7018-813c-096163b6902e';
-- DELETE FROM "TourDayActivities" WHERE "TourDayId" IN
--   ('019df000-0003-7000-0000-000000000001','019df000-0003-7000-0000-000000000002');
-- DELETE FROM "TourDays" WHERE "ClassificationId"='019df000-0002-7000-0000-000000000001';
-- DELETE FROM "TourClassifications" WHERE "Id"='019df000-0002-7000-0000-000000000001';
-- DELETE FROM "Tours" WHERE "Id"='019df000-0001-7000-0000-000000000001';
-- DELETE FROM "HotelRoomInventory" WHERE "Id"='019df000-0008-7000-0000-000000000001';
-- DELETE FROM "Vehicles" WHERE "Id"='019df000-0007-7000-0000-000000000001';
-- COMMIT;
