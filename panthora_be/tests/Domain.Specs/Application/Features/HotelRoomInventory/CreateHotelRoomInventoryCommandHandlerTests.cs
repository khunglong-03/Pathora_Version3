namespace Domain.Specs.Application.Features.HotelRoomInventory;

using global::Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;
using global::Application.Features.HotelRoomInventory.DTOs;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::Contracts.Interfaces;
using NSubstitute;
using Xunit;

public sealed class CreateHotelRoomInventoryCommandHandlerTests
{
    private readonly IHotelRoomInventoryRepository _inventoryRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUser _user;
    private readonly IUnitOfWork _unitOfWork;
    private readonly CreateHotelRoomInventoryCommandHandler _handler;

    public CreateHotelRoomInventoryCommandHandlerTests()
    {
        _inventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _user = Substitute.For<IUser>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        _handler = new CreateHotelRoomInventoryCommandHandler(
            _inventoryRepository,
            _supplierRepository,
            _user,
            _unitOfWork);
    }

    [Fact]
    public async Task Handle_TC01_ValidCommand_CreatesInventoryAndReturnsDto()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.IsType<HotelRoomInventoryDto>(result.Value);
        Assert.Equal(supplierId, result.Value.SupplierId);
        Assert.Equal("Grand Hotel", result.Value.SupplierName);
        Assert.Equal(RoomType.Standard, result.Value.RoomType);
        Assert.Equal(10, result.Value.TotalRooms);
        await _inventoryRepository.Received(1).AddAsync(Arg.Any<HotelRoomInventoryEntity>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TC02_SupplierNotFound_ReturnsNotFound()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns((SupplierEntity?)null);

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Supplier.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC03_SupplierNotAccommodation_ReturnsValidationError()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Transport Co",
            SupplierType = SupplierType.Transport
        });

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Supplier.NotAccommodation", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC04_DuplicateInventory_ReturnsConflict()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity
            {
                Id = Guid.NewGuid(),
                SupplierId = supplierId,
                RoomType = RoomType.Standard,
                TotalRooms = 5
            });

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("HotelRoomInventory.Duplicate", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC05_AllRoomTypes_CreatesSuccessfully()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });

        var roomTypes = new[]
        {
            RoomType.Single, RoomType.Double, RoomType.Twin, RoomType.Triple,
            RoomType.Family, RoomType.Suite, RoomType.Dormitory
        };

        foreach (var roomType in roomTypes)
        {
            _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, roomType, Arg.Any<CancellationToken>())
                .Returns((HotelRoomInventoryEntity?)null);

            var command = new CreateHotelRoomInventoryCommand(supplierId, roomType, 5, null, null, null, null, null, null);
            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.IsError, $"Failed for room type {roomType}: {result.FirstError?.Code}");
        }
    }

    [Fact]
    public async Task Handle_TC06_CommandWithAllOptionalFields_MappedCorrectly()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("system");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Deluxe, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var command = new CreateHotelRoomInventoryCommand(
            supplierId: supplierId,
            roomType: RoomType.Deluxe,
            totalRooms: 5,
            name: "  Deluxe Suite  ",
            address: "  123 Hotel St  ",
            locationArea: Continent.Asia,
            operatingCountries: "  vn  ",
            imageUrls: "https://img.com/deluxe.jpg",
            notes: "  Ocean view  ");

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Deluxe Suite", result.Value.Name);
        Assert.Equal("123 Hotel St", result.Value.Address);
        Assert.Equal("Asia", result.Value.LocationArea);
        Assert.Equal("VN", result.Value.OperatingCountries);
        Assert.Equal("https://img.com/deluxe.jpg", result.Value.ImageUrls);
        Assert.Equal("Ocean view", result.Value.Notes);
    }

    [Fact]
    public async Task Handle_TC07_PerformedByUserId_PassedToEntity()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns("hotel-admin-123");
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        HotelRoomInventoryEntity? capturedEntity = null;
        _inventoryRepository.AddAsync(Arg.Do<HotelRoomInventoryEntity>(e => capturedEntity = e), Arg.Any<CancellationToken>());

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(capturedEntity);
        Assert.Equal("hotel-admin-123", capturedEntity!.CreatedBy);
        Assert.Equal("hotel-admin-123", capturedEntity.LastModifiedBy);
    }

    [Fact]
    public async Task Handle_TC08_SystemUserFallback_WhenUserIdIsNull()
    {
        var supplierId = Guid.NewGuid();
        _user.Id.Returns((string?)null);
        _supplierRepository.GetByIdAsync(supplierId).Returns(new SupplierEntity
        {
            Id = supplierId,
            Name = "Grand Hotel",
            SupplierType = SupplierType.Accommodation
        });
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        HotelRoomInventoryEntity? capturedEntity = null;
        _inventoryRepository.AddAsync(Arg.Do<HotelRoomInventoryEntity>(e => capturedEntity = e), Arg.Any<CancellationToken>());

        var command = new CreateHotelRoomInventoryCommand(supplierId, RoomType.Standard, 10, null, null, null, null, null, null);
        await _handler.Handle(command, CancellationToken.None);

        Assert.NotNull(capturedEntity);
        Assert.Equal("system", capturedEntity!.CreatedBy);
    }
}
