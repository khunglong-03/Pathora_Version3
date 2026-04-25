using global::Application.Features.TourInstance.Commands;
using FluentValidation.TestHelper;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public class AssignRoomToAccommodationCommandValidatorTests
{
    private readonly AssignRoomToAccommodationCommandValidator _validator;

    public AssignRoomToAccommodationCommandValidatorTests()
    {
        _validator = new AssignRoomToAccommodationCommandValidator();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(1001)]
    public void Validate_WhenRoomCountIsInvalid_ReturnsValidationError(int roomCount)
    {
        var command = new AssignRoomToAccommodationCommand(Guid.NewGuid(), Guid.NewGuid(), "Standard", roomCount);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.RoomCount);
    }

    [Fact]
    public void Validate_WhenRoomCountIsValid_DoesNotReturnError()
    {
        var command = new AssignRoomToAccommodationCommand(Guid.NewGuid(), Guid.NewGuid(), "Standard", 5);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor(x => x.RoomCount);
    }
}
