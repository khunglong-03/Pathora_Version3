using Application.Features.TourInstance.Commands;
using Domain.Enums;
using FluentValidation.TestHelper;
using Xunit;

namespace Domain.Specs.Application.Validators;

public class CreateTourInstanceActivityCommandValidatorTests
{
    private readonly CreateTourInstanceActivityCommandValidator _sut = new();

    [Fact]
    public void Should_HaveError_When_TransportationTypeIsMissingForTransportationActivity()
    {
        var command = new CreateTourInstanceActivityCommand(
            Guid.NewGuid(), Guid.NewGuid(), "Transport", TourDayActivityType.Transportation,
            null, null, null, null, null, false);
            
        var result = _sut.TestValidate(command);
        
        result.ShouldHaveValidationErrorFor(x => x.TransportationType)
              .WithErrorCode("TourInstanceActivity.TransportationTypeRequired");
    }

    [Fact]
    public void Should_HaveError_When_GroundFieldsProvidedForExternalTransport()
    {
        var command = new CreateTourInstanceActivityCommand(
            Guid.NewGuid(), Guid.NewGuid(), "Transport", TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            TransportationType.Flight, null, null, null, null, null,
            VehicleType.Car, 4, null);
            
        var result = _sut.TestValidate(command);
        
        result.ShouldHaveValidationErrorFor(x => x.RequestedVehicleType)
              .WithErrorCode("TourInstanceActivity.GroundFieldsNotAllowedForExternal");
        result.ShouldHaveValidationErrorFor(x => x.RequestedSeatCount)
              .WithErrorCode("TourInstanceActivity.GroundFieldsNotAllowedForExternal");
    }

    [Fact]
    public void Should_HaveError_When_ExternalFieldsProvidedForGroundTransport()
    {
        var command = new CreateTourInstanceActivityCommand(
            Guid.NewGuid(), Guid.NewGuid(), "Transport", TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            TransportationType.Car, null, null, null, 
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddHours(1),
            null, null, "Ref123");
            
        var result = _sut.TestValidate(command);
        
        result.ShouldHaveValidationErrorFor(x => x.DepartureTime)
              .WithErrorCode("TourInstanceActivity.ExternalFieldsNotAllowedForGround");
        result.ShouldHaveValidationErrorFor(x => x.ArrivalTime)
              .WithErrorCode("TourInstanceActivity.ExternalFieldsNotAllowedForGround");
        result.ShouldHaveValidationErrorFor(x => x.ExternalTransportReference)
              .WithErrorCode("TourInstanceActivity.ExternalFieldsNotAllowedForGround");
    }

    [Fact]
    public void Should_NotHaveError_For_ValidFlight()
    {
        var command = new CreateTourInstanceActivityCommand(
            Guid.NewGuid(), Guid.NewGuid(), "Transport", TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            TransportationType.Flight, null, null, null, 
            DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddHours(1),
            null, null, "Ref123");
            
        var result = _sut.TestValidate(command);
        
        result.ShouldNotHaveValidationErrorFor(x => x.TransportationType);
        result.ShouldNotHaveValidationErrorFor(x => x.RequestedVehicleType);
        result.ShouldNotHaveValidationErrorFor(x => x.DepartureTime);
    }

    [Fact]
    public void Should_NotHaveError_For_ValidCar()
    {
        var command = new CreateTourInstanceActivityCommand(
            Guid.NewGuid(), Guid.NewGuid(), "Transport", TourDayActivityType.Transportation,
            null, null, null, null, null, false,
            TransportationType.Car, null, null, null, 
            null, null,
            VehicleType.Car, 4, null);
            
        var result = _sut.TestValidate(command);
        
        result.ShouldNotHaveValidationErrorFor(x => x.TransportationType);
        result.ShouldNotHaveValidationErrorFor(x => x.RequestedVehicleType);
        result.ShouldNotHaveValidationErrorFor(x => x.DepartureTime);
    }
}
