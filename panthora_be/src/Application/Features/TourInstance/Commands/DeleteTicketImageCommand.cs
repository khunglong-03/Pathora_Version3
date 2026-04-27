using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.File;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record DeleteTicketImageCommand(
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("imageId")] Guid ImageId) : ICommand<ErrorOr<Success>>;

public sealed class DeleteTicketImageCommandHandler(
    ITicketImageRepository ticketImageRepository,
    IFileService fileService,
    IUnitOfWork unitOfWork,
    IUser user,
    ILanguageContext? languageContext = null
) : ICommandHandler<DeleteTicketImageCommand, ErrorOr<Success>>
{
    private static readonly string[] ManagerRoles = ["Admin", "Manager"];

    public async Task<ErrorOr<Success>> Handle(DeleteTicketImageCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;

        if (string.IsNullOrWhiteSpace(user.Id))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription.Resolve(lang));

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ManagementRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        var entity = await ticketImageRepository.FindByIdAsync(request.ImageId, cancellationToken);
        if (entity is null)
            return Error.NotFound(TicketImageErrors.NotFoundCode, TicketImageErrors.NotFoundDescription.Resolve(lang));

        if (entity.TourInstanceDayActivityId != request.ActivityId)
            return Error.NotFound(TicketImageErrors.NotFoundCode, TicketImageErrors.NotFoundDescription.Resolve(lang));

        var isUploader = string.Equals(entity.UploadedBy, user.Id, StringComparison.Ordinal);
        var hasManagerRole = (user.Roles ?? []).Any(r => ManagerRoles.Contains(r, StringComparer.OrdinalIgnoreCase));
        if (!isUploader && !hasManagerRole)
            return Error.Forbidden(TicketImageErrors.DeleteForbiddenCode, TicketImageErrors.DeleteForbiddenDescription.Resolve(lang));

        var fileId = entity.Image.FileId;

        ticketImageRepository.Delete(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(fileId) && Guid.TryParse(fileId, out var fileGuid))
        {
            try
            {
                await fileService.DeleteMultipleFilesAsync(new DeleteMultipleFilesRequest([fileGuid]));
            }
            catch
            {
                // Storage cleanup is best-effort; entity already removed. A scheduled sweep can reconcile orphans.
            }
        }

        return Result.Success;
    }
}
