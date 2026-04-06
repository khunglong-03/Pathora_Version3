using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.Identity;

public sealed record UpdateMyProfileRequest(
    string? FullName,
    string? PhoneNumber,
    string? Address,
    string? Avatar
);

public sealed class UpdateMyProfileRequestValidator : AbstractValidator<UpdateMyProfileRequest>
{
    public UpdateMyProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .MaximumLength(100).WithMessage(ValidationMessages.FullNameTooLong);

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^(\+84|84|0)[1-9]\d{8}$")
            .WithMessage(ValidationMessages.PhoneNumberInvalid)
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Address)
            .MaximumLength(500).WithMessage(ValidationMessages.AddressTooLong);

        RuleFor(x => x.Avatar)
            .MaximumLength(500).WithMessage(ValidationMessages.AvatarTooLong)
            .When(x => !string.IsNullOrEmpty(x.Avatar));
    }
}
