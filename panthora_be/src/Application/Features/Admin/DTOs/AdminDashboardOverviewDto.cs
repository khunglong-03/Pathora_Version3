namespace Application.Features.Admin.DTOs;

using global::Contracts.ModelResponse;

public sealed record AdminDashboardOverviewDto(
    int TotalUsers,
    int ActiveManagers,
    int ActiveTransportProviders,
    int ActiveHotelProviders,
    int PendingTourRequests,
    List<ActivityItemDto> RecentActivity
);
