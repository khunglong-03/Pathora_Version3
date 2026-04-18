namespace Domain.Specs.Application.Features.BookingManagement.Supplier;

using Application.Features.BookingManagement.Supplier;
using Application.Features.HotelServiceProvider.Supplier;
using Application.Features.HotelServiceProvider.Supplier.DTOs;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using FluentValidation.TestHelper;
using NSubstitute;
using Xunit;

public sealed class CreateSupplierCommandValidatorTests
{
    private readonly CreateSupplierCommandValidator _validator = new();

    [Fact]
    public void Validate_AccommodationWithoutPrimaryContinent_Fails()
    {
        var command = new CreateSupplierCommand(
            "SUP-001",
            SupplierType.Accommodation,
            "Hotel Supplier",
            null,
            null,
            null,
            null,
            null);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_AccommodationWithUnsupportedPrimaryContinent_Fails()
    {
        var command = new CreateSupplierCommand(
            "SUP-001",
            SupplierType.Accommodation,
            "Hotel Supplier",
            null,
            null,
            null,
            null,
            (Continent)999);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_TransportWithoutPrimaryContinent_Fails()
    {
        var command = new CreateSupplierCommand(
            "SUP-TR-001",
            SupplierType.Transport,
            "Transport Supplier",
            null,
            null,
            null,
            null,
            null);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_TransportWithPrimaryContinent_Passes()
    {
        var command = new CreateSupplierCommand(
            "SUP-TR-001",
            SupplierType.Transport,
            "Transport Supplier",
            null,
            null,
            null,
            null,
            Continent.Americas);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.PrimaryContinent);
    }
}

public sealed class CreateSupplierWithOwnerCommandValidatorTests
{
    private readonly CreateSupplierWithOwnerCommandValidator _validator = new();

    [Fact]
    public void Validate_AccommodationWithoutPrimaryContinent_Fails()
    {
        var command = new CreateSupplierWithOwnerCommand(
            "owner@example.com",
            "Owner User",
            "SUP-002",
            SupplierType.Accommodation,
            "Hotel Supplier",
            null,
            null,
            null,
            null,
            null);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_AccommodationWithSupportedPrimaryContinent_Passes()
    {
        var command = new CreateSupplierWithOwnerCommand(
            "owner@example.com",
            "Owner User",
            "SUP-002",
            SupplierType.Accommodation,
            "Hotel Supplier",
            null,
            null,
            null,
            null,
            Continent.Americas);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_AccommodationWithUnsupportedPrimaryContinent_Fails()
    {
        var command = new CreateSupplierWithOwnerCommand(
            "owner@example.com",
            "Owner User",
            "SUP-002",
            SupplierType.Accommodation,
            "Hotel Supplier",
            null,
            null,
            null,
            null,
            (Continent)999);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_TransportWithoutPrimaryContinent_Fails()
    {
        var command = new CreateSupplierWithOwnerCommand(
            "owner@example.com",
            "Owner User",
            "SUP-TR-002",
            SupplierType.Transport,
            "Transport Supplier",
            null,
            null,
            null,
            null,
            null);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PrimaryContinent);
    }

    [Fact]
    public void Validate_TransportWithPrimaryContinent_Passes()
    {
        var command = new CreateSupplierWithOwnerCommand(
            "owner@example.com",
            "Owner User",
            "SUP-TR-002",
            SupplierType.Transport,
            "Transport Supplier",
            null,
            null,
            null,
            null,
            Continent.Asia);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.PrimaryContinent);
    }
}

public sealed class UpdateSupplierCommandHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UpdateSupplierCommandHandler _handler;

    public UpdateSupplierCommandHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _handler = new UpdateSupplierCommandHandler(_supplierRepository, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenGeographyIsNotEdited_PreservesStoredContinent()
    {
        var supplierId = Guid.NewGuid();
        var supplier = SupplierEntity.Create(
            "SUP-003",
            SupplierType.Accommodation,
            "Existing Hotel",
            "system",
            continent: Continent.Europe);
        supplier.GetType().GetProperty(nameof(SupplierEntity.Id))!.SetValue(supplier, supplierId);

        _supplierRepository.GetByIdAsync(supplierId).Returns(supplier);
        _supplierRepository.GetByCodeAsync("SUP-003").Returns(supplier);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var result = await _handler.Handle(
            new UpdateSupplierCommand(
                supplierId,
                "SUP-003",
                SupplierType.Accommodation,
                "Updated Hotel",
                "0123",
                "hotel@example.com",
                "123 Main St",
                "Updated note",
                true),
            CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(Continent.Europe, supplier.Continent);
        _supplierRepository.Received(1).Update(supplier);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}

public sealed class UpdateSupplierInfoCommandHandlerTests
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly IUser _user;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UpdateSupplierInfoCommandHandler _handler;

    public UpdateSupplierInfoCommandHandlerTests()
    {
        _supplierRepository = Substitute.For<ISupplierRepository>();
        _user = Substitute.For<IUser>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _handler = new UpdateSupplierInfoCommandHandler(_supplierRepository, _user, _unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenProviderUpdatesContactFields_PreservesStoredContinent()
    {
        var ownerUserId = Guid.NewGuid();
        var supplier = SupplierEntity.Create(
            "SUP-004",
            SupplierType.Accommodation,
            "Provider Hotel",
            "system",
            continent: Continent.Oceania,
            ownerUserId: ownerUserId);

        _user.Id.Returns(ownerUserId.ToString());
        _supplierRepository.FindByOwnerUserIdAsync(ownerUserId).Returns(supplier);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(1);

        var result = await _handler.Handle(
            new UpdateSupplierInfoCommand(
                new UpdateSupplierInfoRequestDto(
                    "Provider Hotel Updated",
                    "0987",
                    "provider@example.com",
                    "456 Updated St",
                    "Updated notes")),
            CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(Continent.Oceania, supplier.Continent);
        Assert.Equal("Provider Hotel Updated", result.Value.Name);
        _supplierRepository.Received(1).Update(supplier);
        await _unitOfWork.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
