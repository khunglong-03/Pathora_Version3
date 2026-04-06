using Application.Common;
using Application.Common.Constant;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using Application.Services;

namespace Application.Features.TourInstance.Commands;

public sealed record ChangeTourInstanceStatusCommand(Guid Id, TourInstanceStatus NewStatus)
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
