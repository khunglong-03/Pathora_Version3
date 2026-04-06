namespace Application.Features.TransportProvider.Drivers.Validators;

using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using FluentValidation;

public sealed class CreateDriverRequestDtoValidator : AbstractValidator<CreateDriverRequestDto>
{
    public CreateDriverRequestDtoValidator(IDriverRepository driverRepository)
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name must not exceed 100 characters.");

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required.")
            .MaximumLength(50).WithMessage("License number must not exceed 50 characters.")
            .MustAsync(async (licenseNumber, ct) => !await driverRepository.ExistsByLicenseNumberAsync(licenseNumber, ct))
            .WithMessage("This license number is already registered.");

        RuleFor(x => x.LicenseType)
            .IsInEnum().WithMessage("Invalid license type.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .Matches(@"^(?:\+84|0)\d{9,10}$").WithMessage("Phone number must be a valid Vietnamese format (e.g., 0912345678 or +84912345678).");
    }
}
