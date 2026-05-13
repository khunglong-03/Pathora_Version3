using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record GuideApproveTourInstanceCommand(
    [property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class GuideApproveTourInstanceCommandValidator : AbstractValidator<GuideApproveTourInstanceCommand>
{
    public GuideApproveTourInstanceCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);
    }
}
