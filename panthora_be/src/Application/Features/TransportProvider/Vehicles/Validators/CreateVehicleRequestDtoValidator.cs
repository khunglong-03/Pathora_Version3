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

        RuleFor(x => x.OperatingCountries)
            .MaximumLength(500).WithMessage("Operating countries must not exceed 500 characters.")
            .Must(BeValidOperatingCountriesFormat).When(x => !string.IsNullOrEmpty(x.OperatingCountries))
            .WithMessage("Operating countries must be comma-separated 2-letter uppercase ISO codes (e.g. VN,TH,MY).");

        RuleFor(x => x.LocationArea)
            .IsInEnum().When(x => x.LocationArea.HasValue)
            .WithMessage("Invalid location area.");
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
