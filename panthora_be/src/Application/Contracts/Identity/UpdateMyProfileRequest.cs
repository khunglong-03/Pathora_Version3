using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record UpdateMyProfileRequest(
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("avatar")] string? Avatar
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
