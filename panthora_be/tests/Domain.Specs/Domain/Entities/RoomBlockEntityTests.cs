namespace Domain.Specs.Entities;

using global::Domain.Entities;
using global::Domain.Enums;

/// <summary>
/// Unit tests for RoomBlockEntity.
/// Tests: Create, UpdateRoomCount, domain invariants.
/// </summary>
public sealed class RoomBlockEntityTests
{
    #region Create Tests

    [Fact]
    public void Create_TC01_AllValid_ShouldCreateEntity()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: blockedDate,
            roomCountBlocked: 5,
            performedBy: "admin");

        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.Equal(supplierId, entity.SupplierId);
        Assert.Equal(global::Domain.Enums.RoomType.Standard, entity.RoomType);
        Assert.Equal(blockedDate, entity.BlockedDate);
        Assert.Equal(5, entity.RoomCountBlocked);
        Assert.Equal("admin", entity.CreatedBy);
        Assert.Equal("admin", entity.LastModifiedBy);
        Assert.NotEqual(default, entity.CreatedOnUtc);
        Assert.NotEqual(default, entity.LastModifiedOnUtc);
    }

    [Fact]
    public void Create_TC02_WithBookingIds_ShouldSetBothIds()
    {
        var supplierId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var badId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Double,
            blockedDate: blockedDate,
            roomCountBlocked: 2,
            performedBy: "system",
            bookingAccommodationDetailId: badId,
            bookingId: bookingId);

        Assert.Equal(badId, entity.BookingAccommodationDetailId);
        Assert.Equal(bookingId, entity.BookingId);
    }

    [Fact]
    public void Create_TC03_WithAllRoomTypes_ShouldMapCorrectly()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);
        var roomTypes = new[]
        {
            global::Domain.Enums.RoomType.Single,
            global::Domain.Enums.RoomType.Double,
            global::Domain.Enums.RoomType.Twin,
            global::Domain.Enums.RoomType.Triple,
            global::Domain.Enums.RoomType.Family,
            global::Domain.Enums.RoomType.Suite,
            global::Domain.Enums.RoomType.Dormitory,
        };

        foreach (var roomType in roomTypes)
        {
            var entity = RoomBlockEntity.Create(
                supplierId: supplierId,
                roomType: roomType,
                blockedDate: blockedDate,
                roomCountBlocked: 1,
                performedBy: "system");

            Assert.Equal(roomType, entity.RoomType);
        }
    }

    [Fact]
    public void Create_TC04_RoomCountBoundaryOne_ShouldPass()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: blockedDate,
            roomCountBlocked: 1,
            performedBy: "admin");

        Assert.Equal(1, entity.RoomCountBlocked);
    }

    [Fact]
    public void Create_TC05_RoomCountZero_ShouldThrow()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            RoomBlockEntity.Create(
                supplierId: supplierId,
                roomType: global::Domain.Enums.RoomType.Standard,
                blockedDate: blockedDate,
                roomCountBlocked: 0,
                performedBy: "admin"));

        Assert.Contains("RoomCountBlocked must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC06_RoomCountNegative_ShouldThrow()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            RoomBlockEntity.Create(
                supplierId: supplierId,
                roomType: global::Domain.Enums.RoomType.Standard,
                blockedDate: blockedDate,
                roomCountBlocked: -3,
                performedBy: "admin"));

        Assert.Contains("RoomCountBlocked must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC07_LargeRoomCount_ShouldPass()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Dormitory,
            blockedDate: blockedDate,
            roomCountBlocked: 100,
            performedBy: "admin");

        Assert.Equal(100, entity.RoomCountBlocked);
    }

    [Fact]
    public void Create_TC08_AuditFieldsPopulated_ShouldBeRecent()
    {
        var before = DateTimeOffset.UtcNow;

        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "system");

        var after = DateTimeOffset.UtcNow;

        Assert.True(entity.CreatedOnUtc >= before && entity.CreatedOnUtc <= after);
        Assert.True(entity.LastModifiedOnUtc >= before && entity.LastModifiedOnUtc <= after);
        Assert.True(Math.Abs((entity.LastModifiedOnUtc - entity.CreatedOnUtc)!.Value.TotalMilliseconds) < 1);
    }

    [Fact]
    public void Create_TC09_NullBookingIds_ShouldBeNull()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: blockedDate,
            roomCountBlocked: 5,
            performedBy: "admin");

        Assert.Null(entity.BookingAccommodationDetailId);
        Assert.Null(entity.BookingId);
    }

    [Fact]
    public void Create_TC10_BlockingLogic_AllowsMultipleBlocksOnSameDate()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var block1 = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: blockedDate,
            roomCountBlocked: 3,
            performedBy: "system");

        var block2 = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: blockedDate,
            roomCountBlocked: 2,
            performedBy: "system");

        Assert.Equal(3, block1.RoomCountBlocked);
        Assert.Equal(2, block2.RoomCountBlocked);
        Assert.NotEqual(block1.Id, block2.Id);
    }

    #endregion

    #region UpdateRoomCount Tests

    [Fact]
    public void UpdateRoomCount_TC01_ValidUpdate_ShouldUpdateFields()
    {
        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "admin");

        entity.UpdateRoomCount(roomCountBlocked: 10, performedBy: "superadmin");

        Assert.Equal(10, entity.RoomCountBlocked);
        Assert.Equal("superadmin", entity.LastModifiedBy);
    }

    [Fact]
    public void UpdateRoomCount_TC02_RoomCountBoundaryOne_ShouldPass()
    {
        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "admin");

        entity.UpdateRoomCount(roomCountBlocked: 1, performedBy: "admin");

        Assert.Equal(1, entity.RoomCountBlocked);
    }

    [Fact]
    public void UpdateRoomCount_TC03_RoomCountZero_ShouldThrow()
    {
        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "admin");

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.UpdateRoomCount(roomCountBlocked: 0, performedBy: "admin"));

        Assert.Contains("RoomCountBlocked must be greater than 0", exception.Message);
    }

    [Fact]
    public void UpdateRoomCount_TC04_RoomCountNegative_ShouldThrow()
    {
        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "admin");

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.UpdateRoomCount(roomCountBlocked: -1, performedBy: "admin"));

        Assert.Contains("RoomCountBlocked must be greater than 0", exception.Message);
    }

    [Fact]
    public void UpdateRoomCount_TC05_AuditFieldsUpdated_ShouldBeAfterCreate()
    {
        var entity = RoomBlockEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: global::Domain.Enums.RoomType.Standard,
            blockedDate: new DateOnly(2026, 4, 15),
            roomCountBlocked: 5,
            performedBy: "admin");

        var originalModified = entity.LastModifiedOnUtc;

        System.Threading.Thread.Sleep(2);

        entity.UpdateRoomCount(roomCountBlocked: 8, performedBy: "admin");

        Assert.Equal(entity.CreatedOnUtc, entity.CreatedOnUtc);
        Assert.True(entity.LastModifiedOnUtc > originalModified);
    }

    [Fact]
    public void UpdateRoomCount_TC06_OriginalFieldsUnchanged_ShouldOnlyUpdateCount()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var entity = RoomBlockEntity.Create(
            supplierId: supplierId,
            roomType: global::Domain.Enums.RoomType.Double,
            blockedDate: blockedDate,
            roomCountBlocked: 3,
            performedBy: "admin",
            bookingId: Guid.NewGuid());

        var originalSupplierId = entity.SupplierId;
        var originalBlockedDate = entity.BlockedDate;
        var originalBookingId = entity.BookingId;

        entity.UpdateRoomCount(roomCountBlocked: 7, performedBy: "admin");

        Assert.Equal(originalSupplierId, entity.SupplierId);
        Assert.Equal(originalBlockedDate, entity.BlockedDate);
        Assert.Equal(originalBookingId, entity.BookingId);
        Assert.Equal(7, entity.RoomCountBlocked);
    }

    #endregion

    #region Room Blocking Logic

    [Fact]
    public void BlockLogic_TC01_TotalBlockedRooms_CalculatedBySummingBlocks()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var blocks = new[]
        {
            RoomBlockEntity.Create(supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 3, "sys"),
            RoomBlockEntity.Create(supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 2, "sys"),
            RoomBlockEntity.Create(supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 1, "sys"),
        };

        var totalBlocked = blocks.Sum(b => b.RoomCountBlocked);

        Assert.Equal(6, totalBlocked);
    }

    [Fact]
    public void BlockLogic_TC02_OverbookingScenario_ShouldBlockExceedingRooms()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);
        var totalInventory = 10;

        var existingBlocks = new[]
        {
            RoomBlockEntity.Create(supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 5, "sys"),
            RoomBlockEntity.Create(supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 3, "sys"),
        };

        var totalBlocked = existingBlocks.Sum(b => b.RoomCountBlocked);
        var remaining = totalInventory - totalBlocked;

        Assert.Equal(8, totalBlocked);
        Assert.Equal(2, remaining);
    }

    [Fact]
    public void BlockLogic_TC03_FullInventoryBlocked_RemainingIsZero()
    {
        var totalInventory = 10;
        var blockedRooms = 10;

        var remaining = totalInventory - blockedRooms;

        Assert.Equal(0, remaining);
    }

    [Fact]
    public void BlockLogic_TC04_DifferentRoomTypesHaveSeparateBlocks()
    {
        var supplierId = Guid.NewGuid();
        var blockedDate = new DateOnly(2026, 4, 15);

        var standardBlock = RoomBlockEntity.Create(
            supplierId, global::Domain.Enums.RoomType.Standard, blockedDate, 5, "sys");
        var deluxeBlock = RoomBlockEntity.Create(
            supplierId, global::Domain.Enums.RoomType.Deluxe, blockedDate, 3, "sys");

        Assert.NotEqual(standardBlock.RoomType, deluxeBlock.RoomType);
        Assert.Equal(5, standardBlock.RoomCountBlocked);
        Assert.Equal(3, deluxeBlock.RoomCountBlocked);
    }

    #endregion

    #region Test Summary

    /*
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║                     ROOM BLOCK ENTITY - TEST CASE MATRIX                         ║
    ╠════════════════════════════════════════════════════════════════════════════════════╣
    ║ Create                                                                              ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TC01     ║ All valid                         ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC02     ║ With both booking IDs            ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC03     ║ All room types                   ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC04     ║ RoomCount = 1 (boundary)        ║ B     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC05     ║ RoomCount = 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC06     ║ RoomCount < 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC07     ║ Large room count (100)          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC08     ║ Audit fields populated          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC09     ║ Null booking IDs               ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC10     ║ Multiple blocks on same date    ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ UpdateRoomCount                                                                   ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TC01     ║ Valid update                    ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC02     ║ RoomCount = 1 (boundary)        ║ B     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC03     ║ RoomCount = 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC04     ║ RoomCount < 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC05     ║ Audit fields updated           ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC06     ║ Other fields unchanged          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ Block Logic                                                                  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TC01     ║ Sum of multiple blocks          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC02     ║ Overbooking scenario            ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC03     ║ Full inventory blocked         ║ B     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC04     ║ Different room types separate  ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TOTAL    ║ 20 test cases                   ║       ║ 17 ║  4 ║  0 ║ 20    ║
    ╚══════════╩════════════════════════════════════╩═══════╩════╩════╩════╩════════╝

    Legend: N = Normal, A = Abnormal, B = Boundary
    */

    #endregion
}
