using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record TourItineraryFeedbackDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("isFromCustomer")] bool IsFromCustomer,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("status")] Domain.Enums.TourItineraryFeedbackStatus Status,
    [property: JsonPropertyName("forwardedByManagerId")] Guid? ForwardedByManagerId,
    [property: JsonPropertyName("forwardedAt")] DateTimeOffset? ForwardedAt,
    [property: JsonPropertyName("respondedByOperatorId")] Guid? RespondedByOperatorId,
    [property: JsonPropertyName("respondedAt")] DateTimeOffset? RespondedAt,
    [property: JsonPropertyName("approvedByManagerId")] Guid? ApprovedByManagerId,
    [property: JsonPropertyName("approvedAt")] DateTimeOffset? ApprovedAt,
    [property: JsonPropertyName("rejectionReason")] string? RejectionReason,
    [property: JsonPropertyName("rowVersion")] string RowVersion);

public sealed record PrivateTourSettlementResultDto(
    [property: JsonPropertyName("delta")] decimal Delta,
    [property: JsonPropertyName("topUpTransactionId")] Guid? TopUpTransactionId,
    [property: JsonPropertyName("creditAmount")] decimal? CreditAmount);
