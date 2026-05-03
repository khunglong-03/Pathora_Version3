using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourInstance.Commands;

public sealed class AssignTourInstanceGuidesCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    global::Contracts.Interfaces.IUser user)
    : ICommandHandler<AssignTourInstanceGuidesCommand, ErrorOr<Success>>
{
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly global::Contracts.Interfaces.IUser _user = user;

    public async Task<ErrorOr<Success>> Handle(AssignTourInstanceGuidesCommand request, CancellationToken cancellationToken)
    {
        var entity = await _tourInstanceRepository.FindById(request.Id, cancellationToken: cancellationToken);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (entity.IsLockedForOperatorEdit())
            return Error.Validation("TourInstance.LockedForEdit", "Lịch trình đang chờ duyệt, không thể chỉnh sửa.");

        if (request.GuideUserIds.Count > 0)
        {
            var conflictingInstances = await _tourInstanceRepository.FindConflictingInstancesForManagers(
                request.GuideUserIds, entity.StartDate, entity.EndDate, request.Id, cancellationToken);

            if (conflictingInstances.Count != 0)
            {
                return Error.Validation("TourInstance.GuideConflict", "Một trong những hướng dẫn viên đã có lịch vào ngày này.");
            }
        }

        var performedBy = _user.Id ?? string.Empty;

        var existingManagers = entity.Managers.ToList();
        var existingGuides = existingManagers.Where(m => m.Role == TourInstanceManagerRole.Guide).ToList();
        var desiredGuideIds = request.GuideUserIds.Distinct().ToList();

        // Remove guides that are no longer desired
        foreach (var existing in existingGuides)
        {
            if (!desiredGuideIds.Contains(existing.UserId))
            {
                entity.Managers.Remove(existing);
            }
        }

        // Add guides that are newly desired
        foreach (var desiredUserId in desiredGuideIds)
        {
            if (!existingGuides.Any(e => e.UserId == desiredUserId))
            {
                entity.Managers.Add(TourInstanceManagerEntity.Create(
                    entity.Id, desiredUserId, TourInstanceManagerRole.Guide, performedBy));
            }
        }

        entity.LastModifiedBy = performedBy;
        entity.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        await _tourInstanceRepository.Update(entity, cancellationToken);

        return Result.Success;
    }
}
