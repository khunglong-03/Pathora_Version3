using global::Application.Common;
using global::Application.Features.TourInstance.Queries;
using global::Domain.Enums;

namespace Domain.Specs.Application.Features.TourInstance.Queries;

public sealed class GetAllTourInstancesQueryTests
{
    [Fact]
    public void CacheKey_WhenPrincipalsDiffer_ShouldDiffer()
    {
        var managerAId = Guid.NewGuid().ToString();
        var managerBId = Guid.NewGuid().ToString();

        var managerAQuery = new GetAllTourInstancesQuery("ha long", TourInstanceStatus.Available, 1, 10, true, null, managerAId);
        var managerBQuery = new GetAllTourInstancesQuery("ha long", TourInstanceStatus.Available, 1, 10, true, null, managerBId);

        Assert.NotEqual(managerAQuery.CacheKey, managerBQuery.CacheKey);
    }

    [Fact]
    public void CacheKey_WhenPrincipalMissingOrInvalid_ShouldUseAnonSentinel()
    {
        var missingPrincipalQuery = new GetAllTourInstancesQuery(null, null, 1, 10);
        var invalidPrincipalQuery = new GetAllTourInstancesQuery(null, null, 1, 10, false, null, "not-a-guid");

        Assert.Contains(":anon:", missingPrincipalQuery.CacheKey);
        Assert.Contains(":anon:", invalidPrincipalQuery.CacheKey);
    }

    [Fact]
    public void CacheKey_ShouldKeepTourInstanceNamespace()
    {
        var managerId = Guid.NewGuid().ToString();
        var query = new GetAllTourInstancesQuery(null, null, 1, 10, false, null, managerId);

        Assert.StartsWith($"{CacheKey.TourInstance}:all:", query.CacheKey);
    }
}
