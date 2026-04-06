using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using Application.Services;

namespace Application.Features.TourInstance.Queries;

public sealed record CheckDuplicateTourInstanceQuery(
    Guid TourId,
    Guid ClassificationId,
    DateTimeOffset StartDate) : IQuery<ErrorOr<CheckDuplicateTourInstanceResultDto>>;

public sealed class CheckDuplicateTourInstanceQueryValidator : AbstractValidator<CheckDuplicateTourInstanceQuery>
{
    public CheckDuplicateTourInstanceQueryValidator()
    {
        RuleFor(x => x.TourId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceTourIdRequired);

        RuleFor(x => x.ClassificationId)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceClassificationIdRequired);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage(ValidationMessages.TourInstanceStartDateRequired);
    }
}

public sealed class CheckDuplicateTourInstanceQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<CheckDuplicateTourInstanceQuery, ErrorOr<CheckDuplicateTourInstanceResultDto>>
{
    public async Task<ErrorOr<CheckDuplicateTourInstanceResultDto>> Handle(
        CheckDuplicateTourInstanceQuery request,
        CancellationToken cancellationToken)
    {
        return await tourInstanceService.CheckDuplicate(request.TourId, request.ClassificationId, request.StartDate);
    }
}
