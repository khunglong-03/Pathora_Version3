namespace Infrastructure.Options;

public class AdminDashboardOptions
{
    public int DashboardMonthWindow { get; init; } = 12;
    public int CustomerGrowthMonthWindow { get; init; } = 6;
    public int RankedItemLimit { get; init; } = 5;
    public int NearlyFullCancellationThreshold { get; init; } = 90;
    public int DangerCancellationRateThreshold { get; init; } = 5;
}
