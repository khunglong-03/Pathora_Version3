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

    public sealed record FeedbackRejectBody([property: JsonPropertyName("reason")] string Reason, [property: JsonPropertyName("rowVersion")] string RowVersion);
    
    public sealed record FeedbackTransitionBody([property: JsonPropertyName("rowVersion")] string RowVersion);
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

    [HttpPost(TourInstanceEndpoint.FeedbackForwardToOperator)]
    public async Task<IActionResult> ForwardToOperator(Guid id, Guid dayId, Guid feedbackId, [FromBody] FeedbackTransitionBody body)
    {
        var result = await Sender.Send(new ForwardCustomerFeedbackToOperatorCommand(id, dayId, feedbackId, body.RowVersion));
        return HandleResult(result);
    }

    [HttpPost(TourInstanceEndpoint.FeedbackManagerApprove)]
    public async Task<IActionResult> ManagerApprove(Guid id, Guid dayId, Guid feedbackId, [FromBody] FeedbackTransitionBody body)
    {
        var result = await Sender.Send(new ApproveOperatorResponseCommand(id, dayId, feedbackId, body.RowVersion));
        return HandleResult(result);
    }

    [HttpPost(TourInstanceEndpoint.FeedbackManagerReject)]
    public async Task<IActionResult> ManagerReject(Guid id, Guid dayId, Guid feedbackId, [FromBody] FeedbackRejectBody body)
    {
        var result = await Sender.Send(new RejectOperatorResponseCommand(id, dayId, feedbackId, body.Reason, body.RowVersion));
        return HandleResult(result);
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

    public sealed record ManagerRejectItineraryBody([property: JsonPropertyName("reason")] string Reason);

    /// <summary>Manager duyệt lịch trình private tour (PendingManagerReview → PendingCustomerApproval).</summary>
    [HttpPost(TourInstanceEndpoint.ManagerApproveItinerary)]
    public async Task<IActionResult> ManagerApproveItinerary(Guid id)
    {
        var svc = HttpContext.RequestServices.GetRequiredService<Application.Services.ITourInstanceService>();
        var result = await svc.ManagerApproveItinerary(id);
        return HandleResult(result);
    }

    /// <summary>Manager từ chối lịch trình private tour (PendingManagerReview → PendingAdjustment).</summary>
    [HttpPost(TourInstanceEndpoint.ManagerRejectItinerary)]
    public async Task<IActionResult> ManagerRejectItinerary(Guid id, [FromBody] ManagerRejectItineraryBody body)
    {
        var svc = HttpContext.RequestServices.GetRequiredService<Application.Services.ITourInstanceService>();
        var result = await svc.ManagerRejectItinerary(id, body.Reason);
        return HandleResult(result);
    }
}
