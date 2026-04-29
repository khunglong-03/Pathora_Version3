using Api.Endpoint;
using Application.Features.TourInstance.ItineraryFeedback;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Api.Controllers;

/// <summary>Co-design: feedback theo ngày, giá chốt, quyết toán Delta (private tour).</summary>
[Authorize]
[Route(TourInstanceEndpoint.Base)]
public sealed class TourInstanceCoDesignController : BaseApiController
{
    public sealed record CreateFeedbackBody(
        [property: JsonPropertyName("bookingId")] Guid? BookingId,
        [property: JsonPropertyName("content")] string Content,
        [property: JsonPropertyName("isFromCustomer")] bool IsFromCustomer);

    public sealed record UpdateFeedbackBody([property: JsonPropertyName("content")] string Content);

    public sealed record FinalSellPriceBody([property: JsonPropertyName("finalSellPrice")] decimal FinalSellPrice);

    public sealed record PrivateSettlementBody([property: JsonPropertyName("bookingId")] Guid BookingId);

    [HttpGet(TourInstanceEndpoint.DayFeedback)]
    public async Task<IActionResult> ListFeedback(Guid id, Guid dayId)
    {
        var result = await Sender.Send(new ListTourItineraryFeedbackQuery(id, dayId));
        return HandleResult(result);
    }

    [HttpPost(TourInstanceEndpoint.DayFeedback)]
    public async Task<IActionResult> CreateFeedback(Guid id, Guid dayId, [FromBody] CreateFeedbackBody body)
    {
        var cmd = new CreateTourItineraryFeedbackCommand(id, dayId, body.BookingId, body.Content, body.IsFromCustomer);
        var result = await Sender.Send(cmd);
        return HandleCreated(result);
    }

    [HttpPut(TourInstanceEndpoint.DayFeedbackById)]
    public async Task<IActionResult> UpdateFeedback(Guid id, Guid dayId, Guid feedbackId, [FromBody] UpdateFeedbackBody body)
    {
        var result = await Sender.Send(new UpdateTourItineraryFeedbackCommand(id, dayId, feedbackId, body.Content));
        return HandleResult(result);
    }

    [HttpDelete(TourInstanceEndpoint.DayFeedbackById)]
    public async Task<IActionResult> DeleteFeedback(Guid id, Guid dayId, Guid feedbackId)
    {
        var result = await Sender.Send(new DeleteTourItineraryFeedbackCommand(id, dayId, feedbackId));
        return HandleDeleted(result);
    }

    [HttpPatch(TourInstanceEndpoint.FinalSellPrice)]
    public async Task<IActionResult> SetFinalSellPrice(Guid id, [FromBody] FinalSellPriceBody body)
    {
        var result = await Sender.Send(new SetPrivateTourFinalSellPriceCommand(id, body.FinalSellPrice));
        return HandleResult(result);
    }

    [HttpPost(TourInstanceEndpoint.PrivateSettlement)]
    public async Task<IActionResult> ApplySettlement(Guid id, [FromBody] PrivateSettlementBody body)
    {
        var result = await Sender.Send(new ApplyPrivateTourSettlementCommand(id, body.BookingId));
        return HandleResult(result);
    }
}
