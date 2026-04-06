namespace Application.Features.TransportProvider.Drivers.Validators;

using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using FluentValidation;

public sealed class UpdateDriverRequestDtoValidator : AbstractValidator<UpdateDriverRequestDto>
{
    public UpdateDriverRequestDtoValidator(IDriverRepository driverRepository)
    {
        RuleFor(x => x.FullName)
            .MaximumLength(100).WithMessage("Full name must not exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.LicenseNumber)
            .MaximumLength(50).WithMessage("License number must not exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.LicenseNumber));

        RuleFor(x => x.LicenseType)
            .IsInEnum().When(x => x.LicenseType.HasValue)
            .WithMessage("Invalid license type.");

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^(?:\+84|0)\d{9,10}$").When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage("Phone number must be a valid Vietnamese format.");
    }
}
