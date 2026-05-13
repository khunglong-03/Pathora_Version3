using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record AssignTourInstanceGuidesCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("guideUserIds")] List<Guid> GuideUserIds) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class AssignTourInstanceGuidesCommandValidator : AbstractValidator<AssignTourInstanceGuidesCommand>
{
    public AssignTourInstanceGuidesCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);
        
        // GuideUserIds can be empty if we want to remove all guides.
    }
}
