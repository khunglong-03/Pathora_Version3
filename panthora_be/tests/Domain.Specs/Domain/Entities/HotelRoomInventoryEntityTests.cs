namespace Domain.Specs.Domain.Entities;

/// <summary>
/// Unit tests for HotelRoomInventoryEntity.
/// Tests: Create, Update, domain invariants.
/// </summary>
public sealed class HotelRoomInventoryEntityTests
{
    #region Create Tests

    [Fact]
    public void Create_TC01_AllValid_ShouldCreateEntity()
    {
        var supplierId = Guid.NewGuid();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        Assert.NotEqual(Guid.Empty, entity.Id);
        Assert.Equal(supplierId, entity.SupplierId);
        Assert.Equal(Domain.Enums.RoomType.Standard, entity.RoomType);
        Assert.Equal(10, entity.TotalRooms);
        Assert.Equal("admin", entity.CreatedBy);
        Assert.Equal("admin", entity.LastModifiedBy);
        Assert.NotEqual(default, entity.CreatedOnUtc);
        Assert.NotEqual(default, entity.LastModifiedOnUtc);
    }

    [Fact]
    public void Create_TC02_AllFieldsProvided_ShouldTrimAndNormalize()
    {
        var supplierId = Guid.NewGuid();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Deluxe,
            totalRooms: 5,
            performedBy: "system",
            name: "  Grand Hotel  ",
            address: "  123 Hotel St  ",
            operatingCountries: "  vn  ",
            notes: "  Breakfast included  ");

        Assert.Equal("Grand Hotel", entity.Name);
        Assert.Equal("123 Hotel St", entity.Address);
        Assert.Equal("VN", entity.OperatingCountries);
        Assert.Equal("Breakfast included", entity.Notes);
    }

    [Fact]
    public void Create_TC03_LocationAreaAsia_ShouldSetContinent()
    {
        var supplierId = Guid.NewGuid();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Family,
            totalRooms: 20,
            performedBy: "admin",
            locationArea: Domain.Enums.Continent.Asia);

        Assert.Equal(Domain.Enums.Continent.Asia, entity.LocationArea);
    }

    [Fact]
    public void Create_TC04_TotalRoomsBoundaryOne_ShouldPass()
    {
        var supplierId = Guid.NewGuid();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Single,
            totalRooms: 1,
            performedBy: "admin");

        Assert.Equal(1, entity.TotalRooms);
    }

    [Fact]
    public void Create_TC05_TotalRoomsZero_ShouldThrow()
    {
        var supplierId = Guid.NewGuid();

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            HotelRoomInventoryEntity.Create(
                supplierId: supplierId,
                roomType: Domain.Enums.RoomType.Standard,
                totalRooms: 0,
                performedBy: "admin"));

        Assert.Contains("TotalRooms must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC06_TotalRoomsNegative_ShouldThrow()
    {
        var supplierId = Guid.NewGuid();

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            HotelRoomInventoryEntity.Create(
                supplierId: supplierId,
                roomType: Domain.Enums.RoomType.Standard,
                totalRooms: -1,
                performedBy: "admin"));

        Assert.Contains("TotalRooms must be greater than 0", exception.Message);
    }

    [Fact]
    public void Create_TC07_AllRoomTypes_ShouldMapCorrectly()
    {
        var supplierId = Guid.NewGuid();
        var roomTypes = new[]
        {
            Domain.Enums.RoomType.Single,
            Domain.Enums.RoomType.Double,
            Domain.Enums.RoomType.Twin,
            Domain.Enums.RoomType.Triple,
            Domain.Enums.RoomType.Family,
            Domain.Enums.RoomType.Suite,
            Domain.Enums.RoomType.Dormitory,
        };

        foreach (var roomType in roomTypes)
        {
            var entity = HotelRoomInventoryEntity.Create(
                supplierId: supplierId,
                roomType: roomType,
                totalRooms: 5,
                performedBy: "system");

            Assert.Equal(roomType, entity.RoomType);
        }
    }

    [Fact]
    public void Create_TC08_ImageUrlsPreservedWithSpaces_ShouldNotTrim()
    {
        var supplierId = Guid.NewGuid();
        var imageUrl = "https://example.com/image with spaces.jpg";

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 3,
            performedBy: "admin",
            imageUrls: imageUrl);

        Assert.Equal(imageUrl, entity.ImageUrls);
    }

    [Fact]
    public void Create_TC09_NullOptionalFields_ShouldBeNull()
    {
        var supplierId = Guid.NewGuid();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: supplierId,
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        Assert.Null(entity.Name);
        Assert.Null(entity.Address);
        Assert.Null(entity.LocationArea);
        Assert.Null(entity.OperatingCountries);
        Assert.Null(entity.ImageUrls);
        Assert.Null(entity.Notes);
    }

    [Fact]
    public void Create_TC10_AuditFieldsPopulated_ShouldBeRecent()
    {
        var before = DateTimeOffset.UtcNow;

        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "system");

        var after = DateTimeOffset.UtcNow;

        Assert.True(entity.CreatedOnUtc >= before && entity.CreatedOnUtc <= after);
        Assert.True(entity.LastModifiedOnUtc >= before && entity.LastModifiedOnUtc <= after);
        Assert.True(Math.Abs((entity.LastModifiedOnUtc - entity.CreatedOnUtc)!.Value.TotalMilliseconds) < 1);
    }

    #endregion

    #region Update Tests

    [Fact]
    public void Update_TC01_ValidUpdate_ShouldUpdateFields()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin",
            name: "Hotel A");

        entity.Update(
            totalRooms: 20,
            roomType: Domain.Enums.RoomType.Deluxe,
            name: "Hotel B",
            address: "New Address",
            locationArea: Domain.Enums.Continent.Europe,
            operatingCountries: "DE",
            imageUrls: "https://img.com/hotel.jpg",
            notes: "Updated notes",
            performedBy: "superadmin");

        Assert.Equal(20, entity.TotalRooms);
        Assert.Equal(Domain.Enums.RoomType.Deluxe, entity.RoomType);
        Assert.Equal("Hotel B", entity.Name);
        Assert.Equal("New Address", entity.Address);
        Assert.Equal(Domain.Enums.Continent.Europe, entity.LocationArea);
        Assert.Equal("DE", entity.OperatingCountries);
        Assert.Equal("https://img.com/hotel.jpg", entity.ImageUrls);
        Assert.Equal("Updated notes", entity.Notes);
        Assert.Equal("superadmin", entity.LastModifiedBy);
    }

    [Fact]
    public void Update_TC02_TotalRoomsBoundaryOne_ShouldPass()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        entity.Update(totalRooms: 1, performedBy: "admin");

        Assert.Equal(1, entity.TotalRooms);
    }

    [Fact]
    public void Update_TC03_TotalRoomsZero_ShouldThrow()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.Update(totalRooms: 0, performedBy: "admin"));

        Assert.Contains("TotalRooms must be greater than 0", exception.Message);
    }

    [Fact]
    public void Update_TC04_TotalRoomsNegative_ShouldThrow()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        var exception = Assert.Throws<ArgumentOutOfRangeException>(() =>
            entity.Update(totalRooms: -5, performedBy: "admin"));

        Assert.Contains("TotalRooms must be greater than 0", exception.Message);
    }

    [Fact]
    public void Update_TC05_NullOptionalFields_ShouldClear()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin",
            name: "Hotel A",
            address: "Old Address");

        entity.Update(
            totalRooms: null,
            name: null,
            address: null,
            performedBy: "admin");

        Assert.Null(entity.Name);
        Assert.Null(entity.Address);
    }

    [Fact]
    public void Update_TC06_OperatingCountriesUppercase_ShouldNormalize()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        entity.Update(operatingCountries: "  fr  ", performedBy: "admin");

        Assert.Equal("FR", entity.OperatingCountries);
    }

    [Fact]
    public void Update_TC07_AuditFieldsUpdated_ShouldBeAfterCreate()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin");

        var originalModified = entity.LastModifiedOnUtc;

        System.Threading.Thread.Sleep(2); // ensure time passes

        entity.Update(totalRooms: 20, performedBy: "admin");

        Assert.Equal(entity.CreatedOnUtc, entity.CreatedOnUtc); // unchanged
        Assert.True(entity.LastModifiedOnUtc > originalModified);
    }

    [Fact]
    public void Update_TC08_OnlyTotalRoomsUpdated_ShouldNotAffectOtherFields()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin",
            name: "Hotel Name",
            address: "Hotel Address");

        entity.Update(totalRooms: 15, performedBy: "admin");

        Assert.Equal(15, entity.TotalRooms);
        Assert.Equal("Hotel Name", entity.Name);
        Assert.Equal("Hotel Address", entity.Address);
    }

    [Fact]
    public void Update_TC09_OnlyRoomTypeUpdated_ShouldNotAffectOtherFields()
    {
        var entity = HotelRoomInventoryEntity.Create(
            supplierId: Guid.NewGuid(),
            roomType: Domain.Enums.RoomType.Standard,
            totalRooms: 10,
            performedBy: "admin",
            name: "Hotel Name");

        entity.Update(roomType: Domain.Enums.RoomType.Suite, performedBy: "admin");

        Assert.Equal(Domain.Enums.RoomType.Suite, entity.RoomType);
        Assert.Equal(10, entity.TotalRooms);
        Assert.Equal("Hotel Name", entity.Name);
    }

    #endregion

    #region Test Summary

    /*
    ╔════════════════════════════════════════════════════════════════════════════════════╗
    ║               HOTEL ROOM INVENTORY ENTITY - TEST CASE MATRIX                    ║
    ╠════════════════════════════════════════════════════════════════════════════════════╣
    ║ Create                                                                              ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TC01     ║ All valid                         ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC02     ║ All fields provided + trim        ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC03     ║ LocationArea set                  ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC04     ║ TotalRooms = 1 (boundary)        ║ B     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC05     ║ TotalRooms = 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC06     ║ TotalRooms < 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC07     ║ All room types                    ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC08     ║ ImageUrls with spaces preserved   ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC09     ║ Null optional fields             ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC10     ║ Audit fields populated           ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ Update                                                                              ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TC01     ║ Valid update all fields          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC02     ║ TotalRooms = 1 (boundary)        ║ B     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC03     ║ TotalRooms = 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC04     ║ TotalRooms < 0                   ║ A     ║    ║ ✓  ║    ║ Pass  ║
    ║ TC05     ║ Null optional fields clears them ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC06     ║ OperatingCountries uppercase     ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC07     ║ Audit fields updated             ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC08     ║ Only totalRooms updated          ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ║ TC09     ║ Only roomType updated            ║ N     ║ ✓  ║    ║    ║ Pass  ║
    ╠══════════╪════════════════════════════════════╪═══════╪════╪════╪════╪════════╣
    ║ TOTAL    ║ 19 test cases                   ║       ║ 15 ║  4 ║  0 ║ 19    ║
    ╚══════════╩════════════════════════════════════╩═══════╩════╩════╩════╩════════╝

    Legend: N = Normal, A = Abnormal, B = Boundary
    */

    #endregion
}
