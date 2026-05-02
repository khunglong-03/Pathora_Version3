namespace Domain.Specs.Application.Features.HotelServiceProvider.Accommodations;

using global::Application.Features.HotelServiceProvider.Accommodations.Commands;
using global::Application.Features.HotelServiceProvider.Accommodations.DTOs;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using global::Contracts.Interfaces;
using NSubstitute;
using Xunit;

public sealed class CreateAccommodationCommandHandlerTests
{
    private readonly IHotelRoomInventoryRepository _inventoryRepository;
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUser _user;
    private readonly IUnitOfWork _unitOfWork;
    private readonly CreateAccommodationCommandHandler _handler;

    public CreateAccommodationCommandHandlerTests()
    {
        _inventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _user = Substitute.For<IUser>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        _handler = new CreateAccommodationCommandHandler(
            _inventoryRepository,
            _supplierRepository,
            _user,
            _unitOfWork);
    }

    private static SupplierEntity CreateAccommodationSupplier(Guid userId) =>
        SupplierEntity.Create("TEST-SUP", SupplierType.Accommodation, "Test Hotel", userId.ToString(), null, null, null, "123 St", null, userId);

    [Fact]
    public async Task Handle_TC01_ValidCommand_ReturnsAccommodationDto()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 5, "Standard Room", "123 Hotel St", null, null, null, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Standard", result.Value.RoomType);
        Assert.Equal(5, result.Value.TotalRooms);
        Assert.Equal("Standard Room", result.Value.Name);
        Assert.Equal("123 Hotel St", result.Value.Address);
    }

    [Fact]
    public async Task Handle_TC02_UnauthorizedUser_ReturnsUnauthorizedError()
    {
        _user.Id.Returns((string?)null);

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 5, null, null, null, null, null, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Unauthorized", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC03_NoSupplierFound_ReturnsNotFoundError()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([]);

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 5, null, null, null, null, null, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Supplier.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC04_DuplicateRoomType_ReturnsConflictError()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns(new HotelRoomInventoryEntity { Id = Guid.NewGuid(), SupplierId = supplier.Id, RoomType = RoomType.Standard, TotalRooms = 3 });

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 5, null, null, null, null, null, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Accommodation.Duplicate", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TC05_AllRoomTypes_SuccessfullyCreated()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);

        var roomTypes = new[]
        {
            RoomType.Single, RoomType.Double, RoomType.Twin, RoomType.Triple,
            RoomType.Family, RoomType.Suite, RoomType.Dormitory
        };

        foreach (var roomType in roomTypes)
        {
            _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, roomType, Arg.Any<CancellationToken>())
                .Returns((HotelRoomInventoryEntity?)null);

            var request = new CreateAccommodationRequestDto(roomType, 3, null, null, null, null, null, null);
            var command = new CreateAccommodationCommand(request);

            var result = await _handler.Handle(command, CancellationToken.None);

            Assert.False(result.IsError, $"Failed for room type {roomType}: {result.FirstError?.Code}");
        }
    }

    [Fact]
    public async Task Handle_TC06_WithContinent_SetsLocationArea()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Deluxe, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var request = new CreateAccommodationRequestDto(RoomType.Deluxe, 2, null, null, (int)Continent.Europe, null, null, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Europe", result.Value.LocationArea);
    }

    [Fact]
    public async Task Handle_TC07_WithImageUrls_SerializesUrls()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Suite, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var imageUrls = new List<string> { "https://img1.com/room.jpg", "https://img2.com/room2.jpg" };
        var request = new CreateAccommodationRequestDto(RoomType.Suite, 1, null, null, null, null, imageUrls, null);
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value.ImageUrls);
    }

    [Fact]
    public async Task Handle_TC08_WithNotes_SetsNotes()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 10, null, null, null, null, null, "Ocean view room");
        var command = new CreateAccommodationCommand(request);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Ocean view room", result.Value.Notes);
    }

    [Fact]
    public async Task Handle_TC09_SavesChanges_CallsRepository()
    {
        var userId = Guid.NewGuid();
        _user.Id.Returns(userId.ToString());
        var supplier = CreateAccommodationSupplier(userId);
        _supplierRepository.FindAllByOwnerUserIdAsync(userId, Arg.Any<CancellationToken>()).Returns([supplier]);
        _inventoryRepository.FindByHotelAndRoomTypeAsync(supplier.Id, RoomType.Standard, Arg.Any<CancellationToken>())
            .Returns((HotelRoomInventoryEntity?)null);

        var request = new CreateAccommodationRequestDto(RoomType.Standard, 5, null, null, null, null, null, null);
        var command = new CreateAccommodationCommand(request);

        await _handler.Handle(command, CancellationToken.None);

        await _inventoryRepository.Received(1).AddAsync(Arg.Any<HotelRoomInventoryEntity>(), Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
