namespace Application.Features.TransportProvider.Vehicles.Validators;

using Application.Features.TransportProvider.Vehicles.DTOs;
using Domain.Enums;
using FluentValidation;

public sealed class UpdateVehicleRequestDtoValidator : AbstractValidator<UpdateVehicleRequestDto>
{
    public UpdateVehicleRequestDtoValidator()
    {
        RuleFor(x => x.VehicleType)
            .IsInEnum().WithMessage("Invalid vehicle type.")
            .Must(type => (Domain.Enums.VehicleType)type is Domain.Enums.VehicleType.Car or Domain.Enums.VehicleType.Bus or Domain.Enums.VehicleType.Minibus
                or Domain.Enums.VehicleType.Van or Domain.Enums.VehicleType.Coach or Domain.Enums.VehicleType.Motorbike)
            .WithMessage("Only ground transport vehicle types are allowed.");

        RuleFor(x => x.SeatCapacity)
            .GreaterThan(0).WithMessage("Seat capacity must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Seat capacity must not exceed 100.")
            .When(x => x.SeatCapacity.HasValue);

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
