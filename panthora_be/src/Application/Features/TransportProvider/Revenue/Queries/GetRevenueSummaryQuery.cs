namespace Application.Features.TransportProvider.Revenue.Queries;

using Application.Features.TransportProvider.Revenue.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;


public sealed record GetRevenueSummaryQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("year")] int Year,
    [property: JsonPropertyName("quarter")] int? Quarter) : IQuery<ErrorOr<RevenueSummaryDto>>;

public sealed class GetRevenueSummaryQueryHandler(
        ITourDayActivityRouteTransportRepository repository)
    : IQueryHandler<GetRevenueSummaryQuery, ErrorOr<RevenueSummaryDto>>
{
    // TODO: Map from actual booking/trip revenue data when available.
    // Currently using placeholder value; replace with real revenue calculation.
    private const long RevenuePerTrip = 1_000_000L;

    public async Task<ErrorOr<RevenueSummaryDto>> Handle(
        GetRevenueSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var completedTrips = await repository.FindCompletedByOwnerIdAsync(
            request.CurrentUserId,
            request.Year,
            request.Quarter,
            cancellationToken);

        var totalRevenue = completedTrips.Count * RevenuePerTrip;
        var completedCount = completedTrips.Count;
        var avgRevenuePerTrip = completedCount > 0
            ? (decimal)totalRevenue / completedCount
            : 0m;

        var monthlyGroups = completedTrips
            .GroupBy(rt => new { rt.UpdatedAt.Year, rt.UpdatedAt.Month })
            .Select(g => new MonthlyRevenueDto(
                g.Key.Year,
                g.Key.Month,
                g.Count() * RevenuePerTrip,
                g.Count()))
            .OrderBy(m => m.Year)
            .ThenBy(m => m.Month)
            .ToList();

        // Ensure all 12 months are represented
        var allMonths = Enumerable.Range(1, 12)
            .Select(m => new DateTimeOffset(request.Year, m, 1, 0, 0, 0, TimeSpan.Zero))
            .Select(d => new MonthlyRevenueDto(
                d.Year,
                d.Month,
                monthlyGroups.FirstOrDefault(g => g.Month == d.Month && g.Year == d.Year)?.Revenue ?? 0,
                monthlyGroups.FirstOrDefault(g => g.Month == d.Month && g.Year == d.Year)?.Trips ?? 0))
            .ToList();

        return new RevenueSummaryDto(
            totalRevenue,
            completedCount,
            avgRevenuePerTrip,
            allMonths);
    }
}