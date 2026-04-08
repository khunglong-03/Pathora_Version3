namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record TripHistoryResponseDto(
    List<TripHistoryItemDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
