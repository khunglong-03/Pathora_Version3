using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourInstance.Commands;

public sealed class GuideApproveTourInstanceCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    global::Contracts.Interfaces.IUser user)
    : ICommandHandler<GuideApproveTourInstanceCommand, ErrorOr<Success>>
{
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly global::Contracts.Interfaces.IUser _user = user;

    public async Task<ErrorOr<Success>> Handle(GuideApproveTourInstanceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _tourInstanceRepository.FindById(request.Id, cancellationToken: cancellationToken);
        if (entity is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (!Guid.TryParse(_user.Id, out var currentUserId))
            return Error.Unauthorized(description: "Invalid user ID");

        var guideAssignment = entity.Managers.FirstOrDefault(m => m.UserId == currentUserId && m.Role == TourInstanceManagerRole.Guide);
        if (guideAssignment is null)
            return Error.Forbidden(description: "You are not assigned as a guide for this tour instance");

        if (guideAssignment.IsAccepted)
            return Result.Success;

        guideAssignment.IsAccepted = true;
        guideAssignment.LastModifiedBy = _user.Id ?? string.Empty;
        guideAssignment.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        await _tourInstanceRepository.Update(entity, cancellationToken);

        return Result.Success;
    }
}
