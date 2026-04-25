namespace Domain.Specs.Application.Validators;

using global::Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;
using global::Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

public sealed class CreateHotelRoomInventoryCommandValidatorTests
{
    private readonly CreateHotelRoomInventoryCommandValidator _validator;

    public CreateHotelRoomInventoryCommandValidatorTests()
    {
        _validator = new CreateHotelRoomInventoryCommandValidator();
    }

    #region SupplierId

    [Fact]
    public void Validate_ValidCommand_Passes()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.NewGuid(),
            RoomType.Standard,
            10);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptySupplierId_Fails()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.Empty,
            RoomType.Standard,
            10);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.SupplierId);
    }

    [Fact]
    public void Validate_DefaultGuidSupplierId_Fails()
    {
        var command = new CreateHotelRoomInventoryCommand(
            default,
            RoomType.Standard,
            10);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.SupplierId);
    }

    #endregion

    #region RoomType

    [Fact]
    public void Validate_AllValidRoomTypes_Passes()
    {
        var supplierId = Guid.NewGuid();
        var roomTypes = new[]
        {
            RoomType.Single, RoomType.Double, RoomType.Twin, RoomType.Triple,
            RoomType.Family, RoomType.Suite, RoomType.Dormitory
        };

        foreach (var roomType in roomTypes)
        {
            var command = new CreateHotelRoomInventoryCommand(supplierId, roomType, 5);
            var result = _validator.TestValidate(command);
            result.ShouldNotHaveValidationErrorFor(x => x.RoomType);
        }
    }

    #endregion

    #region TotalRooms

    [Fact]
    public void Validate_TotalRoomsBoundaryOne_Passes()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.NewGuid(),
            RoomType.Standard,
            1);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.TotalRooms);
    }

    [Fact]
    public void Validate_TotalRoomsZero_Fails()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.NewGuid(),
            RoomType.Standard,
            0);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.TotalRooms)
            .WithErrorMessage("Total rooms must be greater than 0.");
    }

    [Fact]
    public void Validate_TotalRoomsNegative_Fails()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.NewGuid(),
            RoomType.Standard,
            -1);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.TotalRooms)
            .WithErrorMessage("Total rooms must be greater than 0.");
    }

    [Fact]
    public void Validate_TotalRoomsLargeValue_Passes()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.NewGuid(),
            RoomType.Dormitory,
            1000);

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveAnyValidationErrors();
    }

    #endregion

    #region Combined Validation

    [Fact]
    public void Validate_AllFieldsInvalid_HasMultipleErrors()
    {
        var command = new CreateHotelRoomInventoryCommand(
            Guid.Empty,
            RoomType.Standard,
            0);

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.SupplierId);
        result.ShouldHaveValidationErrorFor(x => x.TotalRooms);
    }

    #endregion
}
