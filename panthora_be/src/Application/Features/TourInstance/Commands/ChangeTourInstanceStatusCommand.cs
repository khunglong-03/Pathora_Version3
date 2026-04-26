using Application.Common.Constant;
using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record ChangeTourInstanceStatusCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("newStatus")] TourInstanceStatus NewStatus)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ChangeTourInstanceStatusCommandValidator : AbstractValidator<ChangeTourInstanceStatusCommand>
{
    public ChangeTourInstanceStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceIdRequired);

        RuleFor(x => x.NewStatus)
            .IsInEnum().WithMessage(ValidationMessages.TourInstanceStatusRequired);
    }
}

public sealed class ChangeTourInstanceStatusCommandHandler(ITourInstanceService tourInstanceService)
    : ICommandHandler<ChangeTourInstanceStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ChangeTourInstanceStatusCommand request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.ChangeStatus(request.Id, request.NewStatus);
    }
}
