using global::Application.Features.TransportProvider.Vehicles.Commands;
using global::Application.Features.TransportProvider.Vehicles.DTOs;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using global::Domain.UnitOfWork;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.TransportProvider.Vehicles;

public sealed class CreateVehicleCommandHandlerTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly CreateVehicleCommandHandler _handler;

    public CreateVehicleCommandHandlerTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        _handler = new CreateVehicleCommandHandler(_vehicleRepository, _unitOfWork);
    }

    private static CreateVehicleCommand ValidCommand() => new(
        CurrentUserId: Guid.NewGuid(),
        Request: new CreateVehicleRequestDto(
            VehiclePlate: "30A-12345",
            VehicleType: (int)VehicleType.Car,
            Brand: "Toyota",
            Model: "Camry",
            SeatCapacity: 5,
            LocationArea: (int?)Continent.Asia,
            OperatingCountries: "VN,TH",
            VehicleImageUrls: null,
            Notes: null));

    [Fact]
    public async Task Handle_ValidCommand_CreatesVehicleAndReturnsDto()
    {
        var command = ValidCommand();

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("30A-12345", result.Value.VehiclePlate);
        Assert.Equal("Car", result.Value.VehicleType);
        Assert.Equal("Toyota", result.Value.Brand);
        Assert.Equal("Camry", result.Value.Model);
        Assert.Equal(5, result.Value.SeatCapacity);
        Assert.Equal("Asia", result.Value.LocationArea);
        Assert.Equal("VN,TH", result.Value.OperatingCountries);
        Assert.True(result.Value.IsActive);
        await _vehicleRepository.Received().AddAsync(Arg.Any<VehicleEntity>());
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithImages_SerializesImageUrlsToJson()
    {
        var urls = new List<string> { "https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg" };
        var command = new CreateVehicleCommand(
            Guid.NewGuid(),
            new CreateVehicleRequestDto(
                VehiclePlate: "30A-IMG01",
                VehicleType: (int)VehicleType.Bus,
                Brand: "Hyundai",
                Model: "County",
                SeatCapacity: 25,
                LocationArea: null,
                OperatingCountries: null,
                VehicleImageUrls: urls,
                Notes: null));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value.VehicleImageUrls);
        Assert.Equal(2, result.Value.VehicleImageUrls.Count);
        Assert.Contains("img1.jpg", result.Value.VehicleImageUrls[0]);
    }

    [Fact]
    public async Task Handle_WithLocationArea_CastsToContinent()
    {
        var command = new CreateVehicleCommand(
            Guid.NewGuid(),
            new CreateVehicleRequestDto(
                VehiclePlate: "99B-99999",
                VehicleType: (int)VehicleType.Coach,
                Brand: "Mercedes",
                Model: "Sprinter",
                SeatCapacity: 20,
                LocationArea: (int?)Continent.Europe,
                OperatingCountries: "DE,FR,IT",
                VehicleImageUrls: null,
                Notes: "European tour coach"));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Europe", result.Value.LocationArea);
    }
}

public sealed class UpdateVehicleCommandHandlerTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UpdateVehicleCommandHandler _handler;

    public UpdateVehicleCommandHandlerTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);
        _handler = new UpdateVehicleCommandHandler(_vehicleRepository, _unitOfWork);
    }

    private static UpdateVehicleCommand ValidCommand(string plate = "30A-12345") => new(
        CurrentUserId: Guid.NewGuid(),
        VehiclePlate: plate,
        Request: new UpdateVehicleRequestDto(
            VehicleType: (int)VehicleType.Bus,
            Brand: "Updated Brand",
            Model: "Updated Model",
            SeatCapacity: 40,
            LocationArea: (int?)Continent.Europe,
            OperatingCountries: "DE,FR",
            VehicleImageUrls: null,
            Notes: "Updated notes"));

    [Fact]
    public async Task Handle_ValidCommand_UpdatesVehicleAndReturnsDto()
    {
        var ownerId = Guid.NewGuid();
        var vehicle = new VehicleEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            VehiclePlate = "30A-12345",
            VehicleType = VehicleType.Car,
            SeatCapacity = 5,
            IsActive = true
        };
        _vehicleRepository.FindByPlateAndOwnerIdAsync("30A-12345", ownerId, Arg.Any<CancellationToken>())
            .Returns(vehicle);

        var command = new UpdateVehicleCommand(
            CurrentUserId: ownerId,
            VehiclePlate: "30A-12345",
            Request: new UpdateVehicleRequestDto(
                VehicleType: (int)VehicleType.Bus,
                Brand: "Updated Brand",
                Model: "Updated Model",
                SeatCapacity: 40,
                LocationArea: (int?)Continent.Asia,
                OperatingCountries: "VN",
                VehicleImageUrls: new List<string>(),
                Notes: "Updated notes"
            )
        );

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("30A-12345", result.Value.VehiclePlate);
        Assert.Equal("Bus", result.Value.VehicleType);
        Assert.Equal("Updated Brand", result.Value.Brand);
        Assert.Equal("Updated Model", result.Value.Model);
        Assert.Equal(40, result.Value.SeatCapacity);
        _vehicleRepository.Received().Update(vehicle);
        await _unitOfWork.Received().SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_VehicleNotFound_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        _vehicleRepository.FindByPlateAndOwnerIdAsync("30A-NOTFOUND", ownerId, Arg.Any<CancellationToken>())
            .Returns((VehicleEntity?)null);

        var command = new UpdateVehicleCommand(
            ownerId, "30A-NOTFOUND",
            new UpdateVehicleRequestDto(
                VehicleType: (int)VehicleType.Car,
                Brand: null, Model: null, SeatCapacity: null,
                LocationArea: null, OperatingCountries: null,
                VehicleImageUrls: null, Notes: null));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_NotOwner_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        _vehicleRepository.FindByPlateAndOwnerIdAsync("30A-OTHER", Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns((VehicleEntity?)null);

        var command = new UpdateVehicleCommand(
            ownerId, "30A-OTHER",
            new UpdateVehicleRequestDto(
                VehicleType: (int)VehicleType.Car,
                Brand: null, Model: null, SeatCapacity: null,
                LocationArea: null, OperatingCountries: null,
                VehicleImageUrls: null, Notes: null));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }
}

public sealed class DeleteVehicleCommandHandlerTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly DeleteVehicleCommandHandler _handler;

    public DeleteVehicleCommandHandlerTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _handler = new DeleteVehicleCommandHandler(_vehicleRepository);
    }

    [Fact]
    public async Task Handle_ValidOwner_SoftDeletesVehicle()
    {
        var ownerId = Guid.NewGuid();
        var vehicle = new VehicleEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = ownerId,
            VehiclePlate = "30A-TODELETE",
            VehicleType = VehicleType.Car,
            SeatCapacity = 4
        };
        _vehicleRepository.FindByPlateAndOwnerIdAsync("30A-TODELETE", ownerId, Arg.Any<CancellationToken>())
            .Returns(vehicle);

        var command = new DeleteVehicleCommand(ownerId, "30A-TODELETE");

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _vehicleRepository.Received().SoftDeleteAsync(
            vehicle.Id, ownerId.ToString(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_VehicleNotOwned_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        _vehicleRepository.FindByPlateAndOwnerIdAsync("30A-BADRQ", ownerId, Arg.Any<CancellationToken>())
            .Returns((VehicleEntity?)null);

        var command = new DeleteVehicleCommand(ownerId, "30A-BADRQ");

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }
}