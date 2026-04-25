using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;
public sealed record CheckGuideAvailabilityQuery(
    [property: JsonPropertyName("guideUserIds")] List<Guid> GuideUserIds,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate) : IQuery<ErrorOr<GuideAvailabilityResultDto>>;

public sealed class CheckGuideAvailabilityQueryValidator : AbstractValidator<CheckGuideAvailabilityQuery>
{
    public CheckGuideAvailabilityQueryValidator()
    {
        RuleFor(x => x.GuideUserIds)
            .NotEmpty().WithMessage("At least one guide user ID is required.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required.")
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("End date must be on or after start date.");
    }
}

public sealed class CheckGuideAvailabilityQueryHandler(ITourInstanceRepository tourInstanceRepository)
    : IQueryHandler<CheckGuideAvailabilityQuery, ErrorOr<GuideAvailabilityResultDto>>
{
    public async Task<ErrorOr<GuideAvailabilityResultDto>> Handle(
        CheckGuideAvailabilityQuery request,
        CancellationToken cancellationToken)
    {
        var conflicting = await tourInstanceRepository.FindConflictingInstancesForManagers(
            request.GuideUserIds, request.StartDate, request.EndDate, cancellationToken: cancellationToken);

        // Group conflicts by guide user ID
        var conflicts = request.GuideUserIds
            .Select(guideId =>
            {
                var instances = conflicting
                    .Where(i => i.Managers.Any(m => m.UserId == guideId))
                    .Select(i => new GuideConflictInstanceDto(
                        i.Id,
                        i.Title,
                        i.StartDate,
                        i.EndDate,
                        i.Status.ToString()))
                    .ToList();

                return instances.Count > 0
                    ? new GuideConflictDto(guideId, instances)
                    : null;
            })
            .Where(c => c is not null)
            .Cast<GuideConflictDto>()
            .ToList();

        return new GuideAvailabilityResultDto(conflicts);
    }
}
