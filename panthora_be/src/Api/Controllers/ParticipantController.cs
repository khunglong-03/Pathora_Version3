using Api.Endpoint;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Participant;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize(Policy = "TourAdminOnly")]
[Route(ParticipantEndpoint.Base)]
public class ParticipantController : BaseApiController
{
    [HttpGet(ParticipantEndpoint.Passport)]
    public async Task<IActionResult> GetPassport(Guid id)
    {
        var result = await Sender.Send(new GetParticipantPassportQuery(id));
        return HandleResult(result);
    }

    [HttpPost(ParticipantEndpoint.Passport)]
    public async Task<IActionResult> UpsertPassport(Guid id, [FromBody] UpsertPassportRequest request)
    {
        if (request.PassportId.HasValue)
        {
            var updateCommand = new UpdatePassportCommand(
                request.PassportId.Value,
                request.PassportNumber,
                request.Nationality,
                request.IssuedAt,
                request.ExpiresAt,
                request.FileUrl);

            var updateResult = await Sender.Send(updateCommand);
            return HandleUpdated(updateResult);
        }

        var createCommand = new CreatePassportCommand(
            id,
            request.PassportNumber,
            request.Nationality,
            request.IssuedAt,
            request.ExpiresAt,
            request.FileUrl);

        var createResult = await Sender.Send(createCommand);
        return HandleCreated(createResult);
    }

    [HttpGet(ParticipantEndpoint.Visas)]
    public async Task<IActionResult> GetVisas(Guid id)
    {
        var result = await Sender.Send(new GetParticipantVisasQuery(id));
        return HandleResult(result);
    }

    [HttpPost(ParticipantEndpoint.Visas)]
    public async Task<IActionResult> CreateVisaApplication(Guid id, [FromBody] CreateVisaApplicationRequest request)
    {
        var command = new CreateVisaApplicationCommand(
            id,
            request.PassportId,
            request.DestinationCountry,
            request.MinReturnDate,
            request.VisaFileUrl);

        var result = await Sender.Send(command);
        return HandleCreated(result);
    }
}

public sealed record UpsertPassportRequest(
    Guid? PassportId,
    string PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl);

public sealed record CreateVisaApplicationRequest(
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate,
    string? VisaFileUrl);
