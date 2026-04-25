using System.Text.Json.Serialization;
using global::Contracts.ModelResponse;

namespace Application.Features.Admin.DTOs;
public sealed record AdminDashboardOverviewDto(
    [property: JsonPropertyName("totalUsers")] int TotalUsers,
    [property: JsonPropertyName("activeManagers")] int ActiveManagers,
    [property: JsonPropertyName("activeTransportProviders")] int ActiveTransportProviders,
    [property: JsonPropertyName("activeHotelProviders")] int ActiveHotelProviders,
    [property: JsonPropertyName("pendingTourRequests")] int PendingTourRequests,
    [property: JsonPropertyName("recentActivity")] List<ActivityItemDto> RecentActivity
);
