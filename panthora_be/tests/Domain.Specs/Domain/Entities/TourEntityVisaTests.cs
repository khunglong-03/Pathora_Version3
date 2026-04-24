using Domain.Entities;
using Domain.Enums;

namespace Domain.Specs.Domain.Entities;

public sealed class TourEntityVisaTests
{
    [Fact]
    public void Create_WhenInternationalAndVisaRequired_ShouldSetIsVisa()
    {
        var tour = TourEntity.Create(
            "International Tour",
            "Short",
            "Long",
            "tester",
            tourScope: TourScope.International,
            isVisa: true);

        Assert.True(tour.IsVisa);
    }

    [Fact]
    public void Create_WhenDomesticAndVisaRequired_ShouldResetIsVisa()
    {
        var tour = TourEntity.Create(
            "Domestic Tour",
            "Short",
            "Long",
            "tester",
            tourScope: TourScope.Domestic,
            isVisa: true);

        Assert.False(tour.IsVisa);
    }

    [Fact]
    public void Update_WhenInternationalAndVisaRequired_ShouldSetIsVisa()
    {
        var tour = TourEntity.Create(
            "Initial Tour",
            "Short",
            "Long",
            "tester");

        tour.Update(
            "Updated Tour",
            "Short",
            "Long",
            TourStatus.Active,
            "tester",
            tourScope: TourScope.International,
            isVisa: true);

        Assert.True(tour.IsVisa);
    }

    [Fact]
    public void Update_WhenDomesticAndVisaRequired_ShouldResetIsVisa()
    {
        var tour = TourEntity.Create(
            "Initial Tour",
            "Short",
            "Long",
            "tester",
            tourScope: TourScope.International,
            isVisa: true);

        tour.Update(
            "Updated Tour",
            "Short",
            "Long",
            TourStatus.Active,
            "tester",
            tourScope: TourScope.Domestic,
            isVisa: true);

        Assert.False(tour.IsVisa);
    }
}
