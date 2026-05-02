using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using FluentValidation;

namespace Application.Features.TransportProvider.Drivers.Validators;

public static class DriverRequestValidationMessages
{
    public const string FullNameRequired = "Full name is required.";
    public const string FullNameMaxLength = "Full name must not exceed 100 characters.";
    public const string LicenseNumberRequired = "License number is required.";
    public const string LicenseNumberMaxLength = "License number must not exceed 50 characters.";
    public const string LicenseNumberExists = "This license number is already registered.";
    public const string LicenseTypeInvalid = "Invalid license type.";
    public const string PhoneRequired = "Phone number is required.";
    public const string PhoneInvalid = "Phone number must be a valid Vietnamese format (e.g., 0912345678 or +84912345678).";
    public const string PhonePattern = @"^(?:\+84|0)\d{9,10}$";
}

public sealed class CreateDriverRequestDtoValidator : AbstractValidator<CreateDriverRequestDto>
{
    public CreateDriverRequestDtoValidator(IDriverRepository driverRepository)
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage(DriverRequestValidationMessages.FullNameRequired)
            .MaximumLength(100).WithMessage(DriverRequestValidationMessages.FullNameMaxLength);

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage(DriverRequestValidationMessages.LicenseNumberRequired)
            .MaximumLength(50).WithMessage(DriverRequestValidationMessages.LicenseNumberMaxLength)
            .MustAsync(async (licenseNumber, ct) => !await driverRepository.ExistsByLicenseNumberAsync(licenseNumber, ct))
            .WithMessage(DriverRequestValidationMessages.LicenseNumberExists);

        RuleFor(x => x.LicenseType)
            .IsInEnum().WithMessage(DriverRequestValidationMessages.LicenseTypeInvalid);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage(DriverRequestValidationMessages.PhoneRequired)
            .Matches(DriverRequestValidationMessages.PhonePattern).WithMessage(DriverRequestValidationMessages.PhoneInvalid);
    }
}
