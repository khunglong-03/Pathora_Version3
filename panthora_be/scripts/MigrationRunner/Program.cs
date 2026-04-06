using Npgsql;

var connStr = "Host=34.143.220.132;Port=5432;Database=PPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();

var tables = new[] { "HotelRoomInventory", "RoomBlocks", "GuestArrivals", "GuestArrivalParticipants" };
Console.WriteLine("=== Checking new tables ===");
foreach (var t in tables)
{
    var cmd = conn.CreateCommand();
    cmd.CommandText = $"SELECT COUNT(*) FROM \"{t}\"";
    try { var r = await cmd.ExecuteScalarAsync(); Console.WriteLine($"  [EXISTS] {t}: {r} rows"); }
    catch (Exception ex)
    {
        var msg = ex.Message.Split('\n')[0];
        Console.WriteLine($"  [MISSING] {t}: {msg}");
    }
}

Console.WriteLine("\n=== Migrations applied ===");
var hm = conn.CreateCommand();
hm.CommandText = "SELECT \"MigrationId\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\"";
await using (var rdr = await hm.ExecuteReaderAsync())
{
    while (await rdr.ReadAsync()) Console.WriteLine($"  {rdr.GetString(0)}");
}

Console.WriteLine("\n=== Creating missing tables manually ===");
var missingTables = new List<string>();
foreach (var t in tables)
{
    var chk = conn.CreateCommand();
    chk.CommandText = $"SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = '{t.ToLower()}')";
    var exists = (bool)(await chk.ExecuteScalarAsync() ?? false);
    if (!exists) missingTables.Add(t);
}

if (missingTables.Count == 0)
{
    Console.WriteLine("  All tables already exist. No action needed.");
    return;
}

if (missingTables.Contains("HotelRoomInventory"))
{
    var cmd = conn.CreateCommand();
    cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS ""HotelRoomInventory"" (
    ""Id"" uuid NOT NULL,
    ""SupplierId"" uuid NOT NULL,
    ""RoomType"" varchar(50) NOT NULL,
    ""TotalRooms"" integer NOT NULL,
    ""CreatedOnUtc"" timestamp with time zone NOT NULL,
    ""CreatedBy"" text,
    ""LastModifiedOnUtc"" timestamp with time zone,
    ""LastModifiedBy"" text,
    CONSTRAINT ""PK_HotelRoomInventory"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_HotelRoomInventory_Suppliers_SupplierId"" FOREIGN KEY (""SupplierId"") REFERENCES ""Suppliers"" (""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_HotelRoomInventory_SupplierId"" ON ""HotelRoomInventory"" (""SupplierId"");
CREATE INDEX IF NOT EXISTS ""IX_HotelRoomInventory_SupplierId_RoomType"" ON ""HotelRoomInventory"" (""SupplierId"", ""RoomType"");";
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("  Created HotelRoomInventory");
}

if (missingTables.Contains("RoomBlocks"))
{
    var cmd = conn.CreateCommand();
    cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS ""RoomBlocks"" (
    ""Id"" uuid NOT NULL,
    ""SupplierId"" uuid NOT NULL,
    ""RoomType"" varchar(50) NOT NULL,
    ""BookingAccommodationDetailId"" uuid,
    ""BookingId"" uuid,
    ""BlockedDate"" date NOT NULL,
    ""RoomCountBlocked"" integer NOT NULL,
    ""CreatedOnUtc"" timestamp with time zone NOT NULL,
    ""CreatedBy"" text,
    ""LastModifiedOnUtc"" timestamp with time zone,
    ""LastModifiedBy"" text,
    CONSTRAINT ""PK_RoomBlocks"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_RoomBlocks_BookingAccommodationDetails_BookingAccommodationDetailId"" FOREIGN KEY (""BookingAccommodationDetailId"") REFERENCES ""BookingAccommodationDetails"" (""Id"") ON DELETE SET NULL,
    CONSTRAINT ""FK_RoomBlocks_Suppliers_SupplierId"" FOREIGN KEY (""SupplierId"") REFERENCES ""Suppliers"" (""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_RoomBlocks_BookingAccommodationDetailId"" ON ""RoomBlocks"" (""BookingAccommodationDetailId"");
CREATE INDEX IF NOT EXISTS ""IX_RoomBlocks_SupplierId_RoomType_BlockedDate"" ON ""RoomBlocks"" (""SupplierId"", ""RoomType"", ""BlockedDate"");";
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("  Created RoomBlocks");
}

if (missingTables.Contains("GuestArrivals"))
{
    var cmd = conn.CreateCommand();
    cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS ""GuestArrivals"" (
    ""Id"" uuid NOT NULL,
    ""BookingAccommodationDetailId"" uuid NOT NULL,
    ""SubmittedByUserId"" uuid,
    ""SubmittedAt"" timestamp with time zone,
    ""SubmissionStatus"" varchar(50) NOT NULL,
    ""CheckedInByUserId"" uuid,
    ""ActualCheckInAt"" timestamp with time zone,
    ""CheckedOutByUserId"" uuid,
    ""ActualCheckOutAt"" timestamp with time zone,
    ""Status"" varchar(50) NOT NULL,
    ""Note"" varchar(1000),
    ""CreatedOnUtc"" timestamp with time zone NOT NULL,
    ""CreatedBy"" text,
    ""LastModifiedOnUtc"" timestamp with time zone,
    ""LastModifiedBy"" text,
    CONSTRAINT ""PK_GuestArrivals"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_GuestArrivals_BookingAccommodationDetails_BookingAccommodationDetailId"" FOREIGN KEY (""BookingAccommodationDetailId"") REFERENCES ""BookingAccommodationDetails"" (""Id"") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_GuestArrivals_BookingAccommodationDetailId"" ON ""GuestArrivals"" (""BookingAccommodationDetailId"");";
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("  Created GuestArrivals");
}

if (missingTables.Contains("GuestArrivalParticipants"))
{
    var cmd = conn.CreateCommand();
    cmd.CommandText = @"
CREATE TABLE IF NOT EXISTS ""GuestArrivalParticipants"" (
    ""Id"" uuid NOT NULL,
    ""GuestArrivalId"" uuid NOT NULL,
    ""BookingParticipantId"" uuid NOT NULL,
    ""CreatedOnUtc"" timestamp with time zone NOT NULL,
    ""CreatedBy"" text,
    ""LastModifiedOnUtc"" timestamp with time zone,
    ""LastModifiedBy"" text,
    CONSTRAINT ""PK_GuestArrivalParticipants"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_GuestArrivalParticipants_BookingParticipants_BookingParticipantId"" FOREIGN KEY (""BookingParticipantId"") REFERENCES ""BookingParticipants"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_GuestArrivalParticipants_GuestArrivals_GuestArrivalId"" FOREIGN KEY (""GuestArrivalId"") REFERENCES ""GuestArrivals"" (""Id"") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ""IX_GuestArrivalParticipants_BookingParticipantId"" ON ""GuestArrivalParticipants"" (""BookingParticipantId"");
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_GuestArrivalParticipants_GuestArrivalId_BookingParticipantId"" ON ""GuestArrivalParticipants"" (""GuestArrivalId"", ""BookingParticipantId"");";
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("  Created GuestArrivalParticipants");
}

try
{
    var ins = conn.CreateCommand();
    ins.CommandText = @"INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
VALUES ('20260406125310_AddVehiclesDriversTransportTables', '10.0.0')
ON CONFLICT DO NOTHING";
    await ins.ExecuteNonQueryAsync();
    Console.WriteLine("  Recorded migration in EF history");
}
catch (Exception ex)
{
    Console.WriteLine($"  Note: could not record migration: {ex.Message.Split('\n')[0]}");
}

Console.WriteLine("\nDone!");
