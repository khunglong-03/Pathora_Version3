namespace Application.Features.TransportProvider.Vehicles.Validators;

using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using FluentValidation;

public sealed class CreateVehicleRequestDtoValidator : AbstractValidator<CreateVehicleRequestDto>
{
    public CreateVehicleRequestDtoValidator(IVehicleRepository vehicleRepository)
    {
        RuleFor(x => x.VehiclePlate)
            .NotEmpty().WithMessage("Vehicle plate is required.")
            .MaximumLength(20).WithMessage("Vehicle plate must not exceed 20 characters.")
            .MustAsync(async (plate, ct) => !await vehicleRepository.ExistsByPlateAsync(plate, ct))
            .WithMessage("Vehicle plate already exists.");

        RuleFor(x => x.VehicleType)
            .IsInEnum().WithMessage("Invalid vehicle type.")
            .Must(type => (Domain.Enums.VehicleType)type is Domain.Enums.VehicleType.Car or Domain.Enums.VehicleType.Bus or Domain.Enums.VehicleType.Minibus
                or Domain.Enums.VehicleType.Van or Domain.Enums.VehicleType.Coach or Domain.Enums.VehicleType.Motorbike)
            .WithMessage("Only ground transport vehicle types are allowed (Car, Bus, Minibus, Van, Coach, Motorbike).");

        RuleFor(x => x.SeatCapacity)
            .GreaterThan(0).WithMessage("Seat capacity must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Seat capacity must not exceed 100.");

        RuleFor(x => x.CountryCode)
            .MaximumLength(2).WithMessage("Country code must be exactly 2 characters.")
            .Matches("^[A-Za-z]{2}$").When(x => !string.IsNullOrEmpty(x.CountryCode))
            .WithMessage("Country code must be a valid 2-letter ISO code.");

        RuleFor(x => x.LocationArea)
            .IsInEnum().When(x => x.LocationArea.HasValue)
            .WithMessage("Invalid location area.");
    }
}
