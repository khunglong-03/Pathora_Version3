using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.TourInstance.DTOs;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetTicketImagesQuery(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("activityId")] Guid ActivityId) : IQuery<ErrorOr<List<TicketImageDto>>>;

public sealed class GetTicketImagesQueryHandler(
    ITicketImageRepository ticketImageRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUser user,
    ILanguageContext? languageContext = null
) : IQueryHandler<GetTicketImagesQuery, ErrorOr<List<TicketImageDto>>>
{
    public async Task<ErrorOr<List<TicketImageDto>>> Handle(GetTicketImagesQuery request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;

        if (string.IsNullOrWhiteSpace(user.Id))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription.Resolve(lang));

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ManagementRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription.Resolve(lang));

        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);
        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstanceActivity.NotFoundCode, ErrorConstants.TourInstanceActivity.NotFoundDescription.Resolve(lang));

        var images = await ticketImageRepository.FindByActivityAsync(request.ActivityId, cancellationToken);
        return images.Select(t => new TicketImageDto(
            t.Id,
            t.TourInstanceDayActivityId,
            t.Image.PublicURL,
            t.Image.OriginalFileName,
            t.UploadedBy,
            t.UploadedAt,
            t.BookingId,
            t.BookingReference,
            t.Note)).ToList();
    }
}
