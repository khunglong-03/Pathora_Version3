using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record UpdateUserInfoRequest(
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("avatar")] string Avatar);

public sealed class UpdateUserInfoRequestValidator : AbstractValidator<UpdateUserInfoRequest>
{
    public UpdateUserInfoRequestValidator()
    {
        RuleFor(x => x.FullName)
            .Length(1, 200).WithMessage(ValidationMessages.FullNameTooLong)
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.Avatar)
            .MaximumLength(500).WithMessage(ValidationMessages.AvatarTooLong)
            .When(x => !string.IsNullOrEmpty(x.Avatar));
    }
}

