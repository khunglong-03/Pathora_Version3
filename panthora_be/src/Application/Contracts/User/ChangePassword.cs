using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.User;

public sealed record ChangePasswordRequest(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("newPassword")] string? NewPassword = null);

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage(ValidationMessages.UserIdRequired);
    }
}

