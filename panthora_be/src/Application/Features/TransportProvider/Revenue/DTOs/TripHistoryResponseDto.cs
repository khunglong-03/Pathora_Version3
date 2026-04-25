using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Revenue.DTOs;
public sealed record TripHistoryResponseDto(
    [property: JsonPropertyName("items")] List<TripHistoryItemDto> Items,
    [property: JsonPropertyName("total")] int Total,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("pageSize")] int PageSize,
    [property: JsonPropertyName("totalPages")] int TotalPages
);
