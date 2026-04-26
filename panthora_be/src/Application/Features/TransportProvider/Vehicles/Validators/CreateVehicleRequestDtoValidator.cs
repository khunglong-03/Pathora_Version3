using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using FluentValidation;

namespace Application.Features.TransportProvider.Vehicles.Validators;

public sealed class CreateVehicleRequestDtoValidator : AbstractValidator<CreateVehicleRequestDto>
{
    public CreateVehicleRequestDtoValidator(IVehicleRepository vehicleRepository)
    {
        RuleFor(x => x.VehicleType)
            .IsInEnum().WithMessage(ValidationMessages.VehicleTypeInvalid)
            .Must(type => (Domain.Enums.VehicleType)type is Domain.Enums.VehicleType.Car or Domain.Enums.VehicleType.Bus or Domain.Enums.VehicleType.Minibus
                or Domain.Enums.VehicleType.Van or Domain.Enums.VehicleType.Coach or Domain.Enums.VehicleType.Motorbike)
            .WithMessage(ValidationMessages.VehicleTypeGroundOnly);

        RuleFor(x => x.SeatCapacity)
            .GreaterThan(0).WithMessage(ValidationMessages.VehicleSeatCapacityGreaterThanZero)
            .LessThanOrEqualTo(100).WithMessage(ValidationMessages.VehicleSeatCapacityMax100);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage(ValidationMessages.VehicleQuantityGreaterThanZero)
            .LessThanOrEqualTo(1000).WithMessage(ValidationMessages.VehicleQuantityMax1000);

        RuleFor(x => x.OperatingCountries)
            .MaximumLength(500).WithMessage(ValidationMessages.VehicleOperatingCountriesMaxLength500)
            .Must(BeValidOperatingCountriesFormat).When(x => !string.IsNullOrEmpty(x.OperatingCountries))
            .WithMessage(ValidationMessages.VehicleOperatingCountriesInvalidFormat);

        RuleFor(x => x.LocationArea)
            .IsInEnum().When(x => x.LocationArea.HasValue)
            .WithMessage(ValidationMessages.VehicleLocationAreaInvalid);
    }

    private static bool BeValidOperatingCountriesFormat(string? operatingCountries)
    {
        if (string.IsNullOrEmpty(operatingCountries)) return true;
        var codes = operatingCountries.Split(',', StringSplitOptions.RemoveEmptyEntries);
        if (codes.Length > 100) return false;
        return codes.All(c =>
        {
            var s = c.Trim();
            return s.Length == 2 && s.All(char.IsLetter) && s == s.ToUpperInvariant();
        });
    }
}
