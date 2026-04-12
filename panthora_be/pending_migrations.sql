CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Drivers" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "FullName" character varying(100) NOT NULL,
    "LicenseNumber" character varying(50) NOT NULL,
    "LicenseType" character varying(10) NOT NULL,
    "PhoneNumber" character varying(20) NOT NULL,
    "AvatarUrl" character varying(1000),
    "IsActive" boolean NOT NULL,
    "Notes" character varying(1000),
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_Drivers" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Drivers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "GuestArrivals" (
    "Id" uuid NOT NULL,
    "BookingAccommodationDetailId" uuid NOT NULL,
    "SubmittedByUserId" uuid,
    "SubmittedAt" timestamp with time zone,
    "SubmissionStatus" character varying(50) NOT NULL,
    "CheckedInByUserId" uuid,
    "ActualCheckInAt" timestamp with time zone,
    "CheckedOutByUserId" uuid,
    "ActualCheckOutAt" timestamp with time zone,
    "Status" character varying(50) NOT NULL,
    "Note" character varying(1000),
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_GuestArrivals" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GuestArrivals_BookingAccommodationDetails_BookingAccommodat~" FOREIGN KEY ("BookingAccommodationDetailId") REFERENCES "BookingAccommodationDetails" ("Id") ON DELETE CASCADE
);

CREATE TABLE "HotelRoomInventory" (
    "Id" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "RoomType" character varying(50) NOT NULL,
    "TotalRooms" integer NOT NULL,
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_HotelRoomInventory" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_HotelRoomInventory_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "RoomBlocks" (
    "Id" uuid NOT NULL,
    "SupplierId" uuid NOT NULL,
    "RoomType" character varying(50) NOT NULL,
    "BookingAccommodationDetailId" uuid,
    "BookingId" uuid,
    "BlockedDate" date NOT NULL,
    "RoomCountBlocked" integer NOT NULL,
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_RoomBlocks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_RoomBlocks_BookingAccommodationDetails_BookingAccommodation~" FOREIGN KEY ("BookingAccommodationDetailId") REFERENCES "BookingAccommodationDetails" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_RoomBlocks_Suppliers_SupplierId" FOREIGN KEY ("SupplierId") REFERENCES "Suppliers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Vehicles" (
    "Id" uuid NOT NULL,
    "VehiclePlate" character varying(20) NOT NULL,
    "VehicleType" character varying(30) NOT NULL,
    "Brand" character varying(100),
    "Model" character varying(100),
    "SeatCapacity" integer NOT NULL DEFAULT 1,
    "LocationArea" character varying(20),
    "CountryCode" character varying(2),
    "VehicleImageUrls" jsonb,
    "OwnerId" uuid NOT NULL,
    "IsActive" boolean NOT NULL,
    "IsDeleted" boolean NOT NULL,
    "Notes" character varying(1000),
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_Vehicles" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Vehicles_Users_OwnerId" FOREIGN KEY ("OwnerId") REFERENCES "Users" ("Id") ON DELETE RESTRICT
);

CREATE TABLE "GuestArrivalParticipants" (
    "Id" uuid NOT NULL,
    "GuestArrivalId" uuid NOT NULL,
    "BookingParticipantId" uuid NOT NULL,
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_GuestArrivalParticipants" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_GuestArrivalParticipants_BookingParticipants_BookingPartici~" FOREIGN KEY ("BookingParticipantId") REFERENCES "BookingParticipants" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GuestArrivalParticipants_GuestArrivals_GuestArrivalId" FOREIGN KEY ("GuestArrivalId") REFERENCES "GuestArrivals" ("Id") ON DELETE CASCADE
);

CREATE TABLE "TourDayActivityRouteTransports" (
    "Id" uuid NOT NULL,
    "BookingActivityReservationId" uuid NOT NULL,
    "TourPlanRouteId" uuid NOT NULL,
    "DriverId" uuid,
    "VehicleId" uuid,
    "UpdatedAt" timestamp with time zone NOT NULL,
    "UpdatedById" uuid NOT NULL,
    "CreatedOnUtc" timestamp with time zone NOT NULL,
    "CreatedBy" text,
    "LastModifiedOnUtc" timestamp with time zone,
    "LastModifiedBy" text,
    CONSTRAINT "PK_TourDayActivityRouteTransports" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_TourDayActivityRouteTransports_BookingActivityReservations_~" FOREIGN KEY ("BookingActivityReservationId") REFERENCES "BookingActivityReservations" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TourDayActivityRouteTransports_Drivers_DriverId" FOREIGN KEY ("DriverId") REFERENCES "Drivers" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_TourDayActivityRouteTransports_TourPlanRoutes_TourPlanRoute~" FOREIGN KEY ("TourPlanRouteId") REFERENCES "TourPlanRoutes" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TourDayActivityRouteTransports_Vehicles_VehicleId" FOREIGN KEY ("VehicleId") REFERENCES "Vehicles" ("Id") ON DELETE SET NULL
);

CREATE INDEX "IX_Drivers_IsActive" ON "Drivers" ("IsActive");

CREATE UNIQUE INDEX "IX_Drivers_LicenseNumber" ON "Drivers" ("LicenseNumber");

CREATE INDEX "IX_Drivers_UserId" ON "Drivers" ("UserId");

CREATE INDEX "IX_GuestArrivalParticipants_BookingParticipantId" ON "GuestArrivalParticipants" ("BookingParticipantId");

CREATE UNIQUE INDEX "IX_GuestArrivalParticipants_GuestArrivalId_BookingParticipantId" ON "GuestArrivalParticipants" ("GuestArrivalId", "BookingParticipantId");

CREATE UNIQUE INDEX "IX_GuestArrivals_BookingAccommodationDetailId" ON "GuestArrivals" ("BookingAccommodationDetailId");

CREATE INDEX "IX_HotelRoomInventory_SupplierId" ON "HotelRoomInventory" ("SupplierId");

CREATE INDEX "IX_HotelRoomInventory_SupplierId_RoomType" ON "HotelRoomInventory" ("SupplierId", "RoomType");

CREATE INDEX "IX_RoomBlocks_BookingAccommodationDetailId" ON "RoomBlocks" ("BookingAccommodationDetailId");

CREATE INDEX "IX_RoomBlocks_SupplierId_RoomType_BlockedDate" ON "RoomBlocks" ("SupplierId", "RoomType", "BlockedDate");

CREATE UNIQUE INDEX "IX_TourDayActivityRouteTransports_BookingActivityReservationId~" ON "TourDayActivityRouteTransports" ("BookingActivityReservationId", "TourPlanRouteId");

CREATE INDEX "IX_TourDayActivityRouteTransports_DriverId" ON "TourDayActivityRouteTransports" ("DriverId");

CREATE INDEX "IX_TourDayActivityRouteTransports_TourPlanRouteId" ON "TourDayActivityRouteTransports" ("TourPlanRouteId");

CREATE INDEX "IX_TourDayActivityRouteTransports_VehicleId" ON "TourDayActivityRouteTransports" ("VehicleId");

CREATE INDEX "IX_Vehicles_IsDeleted" ON "Vehicles" ("IsDeleted");

CREATE INDEX "IX_Vehicles_LocationArea" ON "Vehicles" ("LocationArea");

CREATE INDEX "IX_Vehicles_OwnerId" ON "Vehicles" ("OwnerId");

CREATE UNIQUE INDEX "IX_Vehicles_VehiclePlate" ON "Vehicles" ("VehiclePlate");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260406125310_AddVehiclesDriversTransportTables', '10.0.0');

COMMIT;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP INDEX IF EXISTS "IX_TourInstances_Status_InstanceType";

DROP INDEX IF EXISTS "IX_TourInstances_StartDate";

CREATE INDEX CONCURRENTLY "IX_TourInstances_covering"
ON "TourInstances" ("IsDeleted", "InstanceType", "Status", "StartDate")
WHERE "IsDeleted" = false;

CREATE INDEX CONCURRENTLY "IX_TourInstances_BasePrice"
ON "TourInstances" ("BasePrice");

CREATE INDEX CONCURRENTLY "IX_TourInstances_Location_Trgm"
ON "TourInstances" USING gin (LOWER("Location") gin_trgm_ops)
WHERE "IsDeleted" = false;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260406190221_AddTourInstancePerformanceIndexes', '10.0.0');

START TRANSACTION;
ALTER TABLE "Vehicles" DROP COLUMN "CountryCode";

ALTER TABLE "Vehicles" ADD "OperatingCountries" character varying(500);

ALTER TABLE "Suppliers" ADD "OwnerUserId" uuid;

ALTER TABLE "HotelRoomInventory" ADD "Address" character varying(500);

ALTER TABLE "HotelRoomInventory" ADD "ImageUrls" jsonb;

ALTER TABLE "HotelRoomInventory" ADD "LocationArea" character varying(20);

ALTER TABLE "HotelRoomInventory" ADD "Name" character varying(200);

ALTER TABLE "HotelRoomInventory" ADD "Notes" character varying(1000);

ALTER TABLE "HotelRoomInventory" ADD "OperatingCountries" character varying(500);

CREATE INDEX "IX_Vehicles_OperatingCountries" ON "Vehicles" ("OperatingCountries");

CREATE INDEX "IX_Suppliers_OwnerUserId" ON "Suppliers" ("OwnerUserId");

CREATE INDEX "IX_HotelRoomInventory_LocationArea" ON "HotelRoomInventory" ("LocationArea");

CREATE INDEX "IX_HotelRoomInventory_OperatingCountries" ON "HotelRoomInventory" ("OperatingCountries");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260407170207_AddOwnerUserIdToSuppliers', '10.0.0');

COMMIT;

START TRANSACTION;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260407185606_AddTourManagerAssignment', '10.0.0');

COMMIT;

START TRANSACTION;

-- Add manager bank account fields to Users table
ALTER TABLE "Users" ADD COLUMN "BankAccountNumber" character varying(50);
ALTER TABLE "Users" ADD COLUMN "BankCode" character varying(20);
ALTER TABLE "Users" ADD COLUMN "BankAccountName" character varying(200);
ALTER TABLE "Users" ADD COLUMN "BankAccountVerified" boolean NOT NULL DEFAULT false;
ALTER TABLE "Users" ADD COLUMN "BankAccountVerifiedAt" timestamp with time zone;
ALTER TABLE "Users" ADD COLUMN "BankAccountVerifiedBy" uuid;

-- Add manager account audit fields to PaymentTransactions table
ALTER TABLE "PaymentTransactions" ADD COLUMN "ManagerAccountNumber" character varying(50);
ALTER TABLE "PaymentTransactions" ADD COLUMN "ManagerBankCode" character varying(20);
ALTER TABLE "PaymentTransactions" ADD COLUMN "ManagerAccountName" character varying(200);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260412044004_AddManagerBankAccountFields', '10.0.0');

COMMIT;

