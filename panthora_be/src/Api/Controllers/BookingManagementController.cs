using Api.Endpoint;
using Application.Contracts.Booking;
using Application.Common.Constant;
using Application.Features.BookingManagement.Activity;
using Application.Features.BookingManagement.ActivityStatus;
using Application.Features.BookingManagement.Participant;
using Application.Features.BookingManagement.Payable;
using Application.Features.BookingManagement.TourGuide;
using Application.Features.BookingManagement.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "ManagerOnly")]
[Route(BookingManagementEndpoint.Base)]
public class BookingManagementController : BaseApiController
{
    [HttpGet(BookingManagementEndpoint.Activities)]
    public async Task<IActionResult> GetActivities(Guid id)
    {
        var result = await Sender.Send(new GetBookingActivityReservationsQuery(id));
        return HandleResult(result);
    }

    [HttpPost(BookingManagementEndpoint.Activities)]
    public async Task<IActionResult> CreateActivity(Guid id, [FromBody] CreateBookingActivityReservationRequest request)
    {
        var command = new CreateBookingActivityReservationCommand(
            id,
            request.SupplierId,
            request.Order,
            request.ActivityType,
            request.Title,
            request.Description,
            request.StartTime,
            request.EndTime,
            request.TotalServicePrice,
            request.TotalServicePriceAfterTax,
            request.Note);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPut(BookingManagementEndpoint.ActivityDetail)]
    public async Task<IActionResult> UpdateActivity(
        Guid id,
        Guid activityId,
        [FromBody] UpdateBookingActivityReservationRequest request)
    {
        var command = new UpdateBookingActivityReservationCommand(
            activityId,
            request.SupplierId,
            request.Order,
            request.ActivityType,
            request.Title,
            request.Description,
            request.StartTime,
            request.EndTime,
            request.TotalServicePrice,
            request.TotalServicePriceAfterTax,
            request.Status,
            request.Note);

        var result = await Sender.Send(command);
        return HandleUpdated(result);
    }

    [HttpGet(BookingManagementEndpoint.TransportDetails)]
    public async Task<IActionResult> GetTransportDetails(Guid id)
    {
        var result = await Sender.Send(new GetBookingTransportDetailsQuery(id));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.AccommodationDetails)]
    public async Task<IActionResult> GetAccommodationDetails(Guid id)
    {
        var result = await Sender.Send(new GetBookingAccommodationDetailsQuery(id));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.Participants)]
    public async Task<IActionResult> GetParticipants(Guid id)
    {
        var result = await Sender.Send(new GetBookingParticipantsQuery(id));
        return HandleResult(result);
    }

    [HttpPost(BookingManagementEndpoint.Participants)]
    public async Task<IActionResult> CreateParticipant(Guid id, [FromBody] CreateParticipantDto request)
    {
        var command = new CreateParticipantCommand(
            id,
            request.ParticipantType,
            request.FullName,
            request.DateOfBirth,
            request.Gender,
            request.Nationality);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpGet(BookingManagementEndpoint.Payables)]
    public async Task<IActionResult> GetPayables(Guid id)
    {
        var result = await Sender.Send(new GetSupplierPayablesQuery(id));
        return HandleResult(result);
    }

    [HttpPost(BookingManagementEndpoint.Payables)]
    public async Task<IActionResult> CreatePayable(Guid id, [FromBody] CreateSupplierPayableRequest request)
    {
        var command = new CreateSupplierPayableCommand(
            id,
            request.SupplierId,
            request.ExpectedAmount,
            request.DueAt,
            request.Note);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpGet(BookingManagementEndpoint.ActivityStatuses)]
    public async Task<IActionResult> GetActivityStatuses(Guid id)
    {
        var result = await Sender.Send(new GetActivityStatusesQuery(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpGet(BookingManagementEndpoint.ActivityStatusDetail)]
    public async Task<IActionResult> GetActivityStatusDetail(Guid id, Guid tourDayId)
    {
        var result = await Sender.Send(new GetActivityStatusByTourDayQuery(id, tourDayId));
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpPost(BookingManagementEndpoint.ActivityStatusStart)]
    public async Task<IActionResult> StartActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var result = await Sender.Send(new StartActivityCommand(id, tourDayId, request.ActualTime));
        return HandleUpdated(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpPost(BookingManagementEndpoint.ActivityStatusComplete)]
    public async Task<IActionResult> CompleteActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var result = await Sender.Send(new CompleteActivityCommand(id, tourDayId, request.ActualTime));
        return HandleUpdated(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpPost(BookingManagementEndpoint.ActivityStatusCancel)]
    public async Task<IActionResult> CancelActivity(Guid id, Guid tourDayId, [FromBody] UpdateActivityStatusDto request)
    {
        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? ErrorConstants.ActivityStatus.DefaultCancelReason.Resolve(CurrentLanguage)
            : request.Reason;
        var result = await Sender.Send(new CancelActivityCommand(id, tourDayId, reason));
        return HandleUpdated(result);
    }

    [HttpGet(BookingManagementEndpoint.Team)]
    public async Task<IActionResult> GetTeam(Guid id)
    {
        var result = await Sender.Send(new GetBookingTeamQuery(id));
        return HandleResult(result);
    }

    [HttpPost(BookingManagementEndpoint.Team)]
    public async Task<IActionResult> AssignTeamMember(Guid id, [FromBody] AssignTeamMemberDto request)
    {
        var command = new AssignTeamMemberCommand(
            id,
            request.UserId,
            request.AssignedRole,
            request.IsLead,
            AssignedBy: null,
            request.Note);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }

    [HttpPut(BookingManagementEndpoint.TeamMember)]
    public async Task<IActionResult> UpdateTeamMember(Guid id, Guid userId, [FromBody] UpdateTeamMemberRequest request)
    {
        var command = new UpdateTeamMemberAssignmentCommand(
            id,
            userId,
            request.AssignedRole,
            request.IsLead,
            request.Note);

        var result = await Sender.Send(command);
        return HandleUpdated(result);
    }

    [HttpDelete(BookingManagementEndpoint.TeamMember)]
    public async Task<IActionResult> DeleteTeamMember(Guid id, Guid userId)
    {
        var result = await Sender.Send(new DeleteTeamMemberAssignmentCommand(id, userId));
        return HandleDeleted(result);
    }

    [HttpPost(BookingManagementEndpoint.TeamMemberConfirm)]
    public async Task<IActionResult> ConfirmTeamMember(Guid id, Guid userId)
    {
        var result = await Sender.Send(new ConfirmTeamMemberAssignmentCommand(id, userId));
        return HandleUpdated(result);
    }

    [HttpGet(BookingManagementEndpoint.TeamTourManager)]
    public async Task<IActionResult> GetTourManager(Guid id)
    {
        var result = await Sender.Send(new GetBookingTourManagerQuery(id));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.TeamTourDesigners)]
    public async Task<IActionResult> GetTourDesigners(Guid id)
    {
        var result = await Sender.Send(new GetBookingTourDesignersQuery(id));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.TeamTourGuides)]
    public async Task<IActionResult> GetTourGuides(Guid id)
    {
        var result = await Sender.Send(new GetBookingAssignedTourGuidesQuery(id));
        return HandleResult(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllBookings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await Sender.Send(new GetAllBookingsQuery(page, pageSize));
        return HandleResult(result);
    }

    [HttpGet(BookingManagementEndpoint.CheckoutPrice)]
    public async Task<IActionResult> GetCheckoutPrice(Guid id)
    {
        var result = await Sender.Send(new GetCheckoutPriceQuery(id));
        return HandleResult(result);
    }

    [Authorize(Policy = "ManagerOrTourGuideOnly")]
    [HttpGet("by-tour-instance/{tourInstanceId:guid}")]
    public async Task<IActionResult> GetByTourInstance(Guid tourInstanceId)
    {
        var result = await Sender.Send(new GetBookingsByTourInstanceQuery(tourInstanceId));
        return HandleResult(result);
    }
}

public sealed record CreateBookingActivityReservationRequest(
    Guid? SupplierId,
    int Order,
    string ActivityType,
    string Title,
    string? Description,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    decimal TotalServicePrice,
    decimal TotalServicePriceAfterTax,
    string? Note);

public sealed record UpdateBookingActivityReservationRequest(
    Guid? SupplierId,
    int Order,
    string ActivityType,
    string Title,
    string? Description,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    decimal? TotalServicePrice,
    decimal? TotalServicePriceAfterTax,
    ReservationStatus? Status,
    string? Note);

public sealed record CreateSupplierPayableRequest(
    Guid SupplierId,
    decimal ExpectedAmount,
    DateTimeOffset? DueAt,
    string? Note);

public sealed record UpdateTeamMemberRequest(
    AssignedRole AssignedRole,
    bool IsLead,
    string? Note);
