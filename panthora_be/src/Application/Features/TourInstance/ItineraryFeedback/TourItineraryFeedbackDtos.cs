using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.ItineraryFeedback;

public sealed record TourItineraryFeedbackDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourInstanceDayId")] Guid TourInstanceDayId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("content")] string Content,
    [property: JsonPropertyName("isFromCustomer")] bool IsFromCustomer,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc);

public sealed record PrivateTourSettlementResultDto(
    [property: JsonPropertyName("delta")] decimal Delta,
    [property: JsonPropertyName("topUpTransactionId")] Guid? TopUpTransactionId,
    [property: JsonPropertyName("creditAmount")] decimal? CreditAmount);
