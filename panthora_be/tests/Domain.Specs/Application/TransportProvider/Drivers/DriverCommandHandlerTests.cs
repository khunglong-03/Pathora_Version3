using Application.Features.TransportProvider.Drivers.Commands;
using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.TransportProvider.Drivers;

public sealed class CreateDriverCommandHandlerTests
{
    private readonly IDriverRepository _driverRepository;
    private readonly CreateDriverCommandHandler _handler;

    public CreateDriverCommandHandlerTests()
    {
        _driverRepository = Substitute.For<IDriverRepository>();
        _handler = new CreateDriverCommandHandler(_driverRepository);
    }

    private static CreateDriverCommand ValidCommand() => new(
        CurrentUserId: Guid.NewGuid(),
        Request: new CreateDriverRequestDto(
            FullName: "Nguyen Van A",
            LicenseNumber: "0123456789",
            LicenseType: (int)DriverLicenseType.B2,
            PhoneNumber: "0912345678",
            AvatarUrl: null,
            Notes: null));

    [Fact]
    public async Task Handle_ValidCommand_CreatesDriverAndReturnsDto()
    {
        var command = ValidCommand();

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Nguyen Van A", result.Value.FullName);
        Assert.Equal("0123456789", result.Value.LicenseNumber);
        Assert.Equal("B2", result.Value.LicenseType);
        Assert.Equal("0912345678", result.Value.PhoneNumber);
        Assert.True(result.Value.IsActive);
        await _driverRepository.Received().CreateAsync(Arg.Any<DriverEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithAvatar_CreatesDriverWithAvatar()
    {
        var command = new CreateDriverCommand(
            Guid.NewGuid(),
            new CreateDriverRequestDto(
                FullName: "Tran Van B",
                LicenseNumber: "1111111111",
                LicenseType: (int)DriverLicenseType.D,
                PhoneNumber: "0987654321",
                AvatarUrl: "https://cdn.example.com/driver-b.jpg",
                Notes: "Senior driver"));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("https://cdn.example.com/driver-b.jpg", result.Value.AvatarUrl);
        Assert.Equal("Senior driver", result.Value.Notes);
    }
}

public sealed class UpdateDriverCommandHandlerTests
{
    private readonly IDriverRepository _driverRepository;
    private readonly UpdateDriverCommandHandler _handler;

    public UpdateDriverCommandHandlerTests()
    {
        _driverRepository = Substitute.For<IDriverRepository>();
        _handler = new UpdateDriverCommandHandler(_driverRepository);
    }

    private static UpdateDriverCommand ValidCommand(Guid driverId) => new(
        CurrentUserId: Guid.NewGuid(),
        DriverId: driverId,
        Request: new UpdateDriverRequestDto(
            FullName: "Updated Name",
            LicenseNumber: null,
            LicenseType: (int?)DriverLicenseType.C,
            PhoneNumber: "0977123456",
            AvatarUrl: null,
            Notes: "Updated notes"));

    [Fact]
    public async Task Handle_ValidCommand_UpdatesDriverAndReturnsDto()
    {
        var ownerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var driver = new DriverEntity
        {
            Id = driverId,
            UserId = ownerId,
            FullName = "Original Name",
            LicenseNumber = "ORIGINAL99",
            LicenseType = DriverLicenseType.B2,
            PhoneNumber = "0909000000",
            IsActive = true
        };
        _driverRepository.FindByIdAndUserIdAsync(driverId, ownerId, Arg.Any<CancellationToken>())
            .Returns(driver);

        var command = ValidCommand(driverId);
        // Override owner ID to match
        command = new UpdateDriverCommand(
            ownerId, driverId,
            new UpdateDriverRequestDto(
                FullName: "Updated Name",
                LicenseNumber: null,
                LicenseType: (int?)DriverLicenseType.C,
                PhoneNumber: "0977123456",
                AvatarUrl: null,
                Notes: "Updated notes"));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Updated Name", result.Value.FullName);
        Assert.Equal("Updated notes", result.Value.Notes);
        _driverRepository.Received().UpdateAsync(driver, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DriverNotFound_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        _driverRepository.FindByIdAndUserIdAsync(driverId, ownerId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);

        var command = new UpdateDriverCommand(
            ownerId, driverId,
            new UpdateDriverRequestDto(
                FullName: "Hacker",
                LicenseNumber: null,
                LicenseType: null,
                PhoneNumber: null,
                AvatarUrl: null,
                Notes: null));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_DriverBelongsToDifferentOwner_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        _driverRepository.FindByIdAndUserIdAsync(driverId, ownerId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);

        var command = new UpdateDriverCommand(
            ownerId, driverId,
            new UpdateDriverRequestDto(
                FullName: "Hacker Attempt",
                LicenseNumber: null,
                LicenseType: null,
                PhoneNumber: null,
                AvatarUrl: null,
                Notes: null));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }
}

public sealed class DeleteDriverCommandHandlerTests
{
    private readonly IDriverRepository _driverRepository;
    private readonly DeleteDriverCommandHandler _handler;

    public DeleteDriverCommandHandlerTests()
    {
        _driverRepository = Substitute.For<IDriverRepository>();
        _handler = new DeleteDriverCommandHandler(_driverRepository);
    }

    [Fact]
    public async Task Handle_ValidOwner_DeactivatesDriver()
    {
        var ownerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var driver = new DriverEntity
        {
            Id = driverId,
            UserId = ownerId,
            FullName = "To Deactivate",
            LicenseNumber = "DEACT999",
            LicenseType = DriverLicenseType.B2,
            PhoneNumber = "0909000000",
            IsActive = true
        };
        _driverRepository.FindByIdAndUserIdAsync(driverId, ownerId, Arg.Any<CancellationToken>())
            .Returns(driver);

        var command = new DeleteDriverCommand(ownerId, driverId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _driverRepository.Received().DeactivateAsync(
            driverId, ownerId.ToString(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DriverNotOwned_ReturnsNotFound()
    {
        var ownerId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        _driverRepository.FindByIdAndUserIdAsync(driverId, ownerId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);

        var command = new DeleteDriverCommand(ownerId, driverId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
        await _driverRepository.Received(0).DeactivateAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}
