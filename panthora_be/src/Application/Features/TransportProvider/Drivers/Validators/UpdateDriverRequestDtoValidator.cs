using Application.Features.TransportProvider.Drivers.DTOs;
using Domain.Common.Repositories;
using FluentValidation;

namespace Application.Features.TransportProvider.Drivers.Validators;
public sealed class UpdateDriverRequestDtoValidator : AbstractValidator<UpdateDriverRequestDto>
{
    public UpdateDriverRequestDtoValidator(IDriverRepository driverRepository)
    {
        RuleFor(x => x.FullName)
            .MaximumLength(100).WithMessage(DriverRequestValidationMessages.FullNameMaxLength)
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.LicenseNumber)
            .MaximumLength(50).WithMessage(DriverRequestValidationMessages.LicenseNumberMaxLength)
            .When(x => !string.IsNullOrEmpty(x.LicenseNumber));

        RuleFor(x => x.LicenseType)
            .IsInEnum().When(x => x.LicenseType.HasValue)
            .WithMessage(DriverRequestValidationMessages.LicenseTypeInvalid);

        RuleFor(x => x.PhoneNumber)
            .Matches(DriverRequestValidationMessages.PhonePattern).When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage(DriverRequestValidationMessages.PhoneInvalid);
    }
}
