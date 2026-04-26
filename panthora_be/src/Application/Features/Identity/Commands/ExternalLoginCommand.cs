using Application.Common.Constant;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Identity.Commands;

public sealed record ExternalLoginCommand(
    [property: JsonPropertyName("providerKey")] string ProviderKey,
    [property: JsonPropertyName("providerEmail")] string ProviderEmail,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("picture")] string? Picture = null) : ICommand<ErrorOr<ExternalLoginResponse>>;

public sealed class ExternalLoginCommandValidator : AbstractValidator<ExternalLoginCommand>
{
    public ExternalLoginCommandValidator()
    {
        RuleFor(x => x.ProviderKey)
            .NotEmpty().WithMessage(ValidationMessages.ProviderKeyRequired);

        RuleFor(x => x.ProviderEmail)
            .NotEmpty().WithMessage(ValidationMessages.ProviderEmailRequired)
            .EmailAddress().WithMessage(ValidationMessages.ProviderEmailInvalid);
    }
}

public sealed class ExternalLoginCommandHandler(IIdentityService identityService)
    : ICommandHandler<ExternalLoginCommand, ErrorOr<ExternalLoginResponse>>
{
    public async Task<ErrorOr<ExternalLoginResponse>> Handle(
        ExternalLoginCommand request,
        CancellationToken cancellationToken)
    {
        return await identityService.ExternalLogin(
            new ExternalLoginRequest(AuthProviders.Google, request.ProviderKey, request.ProviderEmail, request.FullName, request.Picture));
    }
}
