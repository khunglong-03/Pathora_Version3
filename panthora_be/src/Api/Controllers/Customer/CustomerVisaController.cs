using Api.Endpoint;
using Application.Features.VisaApplication.Commands;
using Application.Features.VisaApplication.Queries;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Customer;

/// <summary>
/// Customer-facing visa API — scoped to bookings/{bookingId}.
/// Mọi route đều check booking ownership (Booking.UserId == currentUser.Id).
/// </summary>
[ApiController]
[Authorize(Policy = "CustomerOnly")]
[Route(PublicEndpoint.Base + "/bookings/{bookingId:guid}")]
public sealed class CustomerVisaController : BaseApiController
{
    /// <summary>
    /// Lấy danh sách participant cần visa và trạng thái visa của mỗi người.
    /// GET /api/public/bookings/{bookingId}/visa-requirements
    /// </summary>
    [HttpGet("visa-requirements")]
    public async Task<IActionResult> GetVisaRequirements(Guid bookingId)
    {
        var result = await Sender.Send(new GetCustomerVisaRequirementsQuery(bookingId));
        return HandleResult(result);
    }

    /// <summary>
    /// Nộp đơn xin visa cho một participant.
    /// POST /api/public/bookings/{bookingId}/visa-applications
    /// </summary>
    [HttpPost("visa-applications")]
    public async Task<IActionResult> SubmitVisa(Guid bookingId, [FromBody] SubmitVisaApplicationRequest body)
    {
        var command = new SubmitCustomerVisaApplicationCommand(
            BookingId: bookingId,
            BookingParticipantId: body.BookingParticipantId,
            PassportId: body.PassportId,
            DestinationCountry: body.DestinationCountry,
            MinReturnDate: body.MinReturnDate,
            VisaFileUrl: body.VisaFileUrl,
            Category: body.Category,
            Format: body.Format,
            MaxStayDays: body.MaxStayDays,
            IssuingAuthority: body.IssuingAuthority);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    /// <summary>
    /// Cập nhật đơn visa (khi đang Pending hoặc sau khi bị Rejected).
    /// PUT /api/public/bookings/{bookingId}/visa-applications/{applicationId}
    /// </summary>
    [HttpPut("visa-applications/{applicationId:guid}")]
    public async Task<IActionResult> UpdateVisa(
        Guid bookingId,
        Guid applicationId,
        [FromBody] UpdateVisaApplicationRequest body)
    {
        var command = new UpdateCustomerVisaApplicationCommand(
            BookingId: bookingId,
            VisaApplicationId: applicationId,
            PassportId: body.PassportId,
            DestinationCountry: body.DestinationCountry,
            MinReturnDate: body.MinReturnDate,
            VisaFileUrl: body.VisaFileUrl,
            Category: body.Category,
            Format: body.Format,
            MaxStayDays: body.MaxStayDays,
            IssuingAuthority: body.IssuingAuthority);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    /// <summary>
    /// Yêu cầu hệ thống hỗ trợ tạo visa cho participant (phát sinh phí).
    /// POST /api/public/bookings/{bookingId}/visa-applications/{participantId}/request-support
    /// </summary>
    [HttpPost("visa-applications/{participantId:guid}/request-support")]
    public async Task<IActionResult> RequestSupport(Guid bookingId, Guid participantId)
    {
        var result = await Sender.Send(new RequestVisaSupportCommand(bookingId, participantId));
        return HandleResult(result);
    }
    /// <summary>
    /// Cập nhật (hoặc thêm) thông tin passport cho participant.
    /// PUT /api/public/bookings/{bookingId}/participants/{participantId}/passport
    /// </summary>
    [HttpPut("participants/{participantId:guid}/passport")]
    public async Task<IActionResult> UpdatePassport(
        Guid bookingId,
        Guid participantId,
        [FromBody] UpdateCustomerPassportRequest body)
    {
        var command = new UpdateCustomerPassportCommand(
            BookingId: bookingId,
            ParticipantId: participantId,
            PassportNumber: body.PassportNumber,
            Nationality: body.Nationality,
            IssuedAt: body.IssuedAt,
            ExpiresAt: body.ExpiresAt,
            FileUrl: body.FileUrl);
        var result = await Sender.Send(command);
        return HandleResult(result);
    }
}

// ─── Request bodies ───────────────────────────────────────────────────────────

public sealed record SubmitVisaApplicationRequest(
    Guid BookingParticipantId,
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate = null,
    string? VisaFileUrl = null,
    VisaCategory? Category = null,
    VisaFormat? Format = null,
    int? MaxStayDays = null,
    string? IssuingAuthority = null);

public sealed record UpdateVisaApplicationRequest(
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate = null,
    string? VisaFileUrl = null,
    VisaCategory? Category = null,
    VisaFormat? Format = null,
    int? MaxStayDays = null,
    string? IssuingAuthority = null);

public sealed record UpdateCustomerPassportRequest(
    string PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl);
