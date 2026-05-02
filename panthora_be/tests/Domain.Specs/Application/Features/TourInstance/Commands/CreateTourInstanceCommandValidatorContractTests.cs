using global::Application.Features.TourInstance.Commands;
using global::Domain.Enums;
using FluentValidation.TestHelper;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public sealed class CreateTourInstanceCommandValidatorContractTests
{
    private readonly CreateTourInstanceCommandValidator _sut = new();

    [Fact]
    public void Validate_8_10_WhenRequestedSeatCountLessThanMaxParticipation_ShouldFail()
    {
        var cmd = new CreateTourInstanceCommand(
            TourId: Guid.NewGuid(),
            ClassificationId: Guid.NewGuid(),
            Title: "T",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1,
            ActivityAssignments:
            [
                new CreateTourInstanceActivityAssignmentDto(
                    OriginalActivityId: Guid.NewGuid(),
                    SupplierId: null,
                    RoomType: null,
                    AccommodationQuantity: null,
                    VehicleId: null,
                    TransportSupplierId: Guid.NewGuid(),
                    RequestedVehicleType: VehicleType.Coach,
                    RequestedSeatCount: 10)
            ]);

        var result = _sut.TestValidate(cmd);

        Assert.False(result.IsValid);
        Assert.Contains(
            result.Errors,
            e => e.ErrorMessage.Contains("MaxParticipation", StringComparison.OrdinalIgnoreCase)
                 || e.ErrorMessage.Contains("RequestedSeatCount", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Validate_WhenTransportSupplierWithoutVehicleType_ShouldFail()
    {
        var cmd = new CreateTourInstanceCommand(
            TourId: Guid.NewGuid(),
            ClassificationId: Guid.NewGuid(),
            Title: "T",
            InstanceType: TourType.Public,
            StartDate: DateTimeOffset.UtcNow.AddDays(1),
            EndDate: DateTimeOffset.UtcNow.AddDays(3),
            MaxParticipation: 20,
            BasePrice: 1,
            ActivityAssignments:
            [
                new CreateTourInstanceActivityAssignmentDto(
                    OriginalActivityId: Guid.NewGuid(),
                    SupplierId: null,
                    RoomType: null,
                    AccommodationQuantity: null,
                    VehicleId: null,
                    TransportSupplierId: Guid.NewGuid(),
                    RequestedVehicleType: null,
                    RequestedSeatCount: 20)
            ]);

        var result = _sut.TestValidate(cmd);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName.Contains("RequestedVehicleType", StringComparison.Ordinal));
    }
}
