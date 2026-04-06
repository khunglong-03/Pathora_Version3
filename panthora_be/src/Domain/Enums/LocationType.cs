using System.ComponentModel;

namespace Domain.Enums;

public enum LocationType
{
    [Description("Tourist Attraction")]
    TouristAttraction = 0,
    [Description("Museum")]
    Museum = 1,
    [Description("National Park")]
    NationalPark = 2,
    [Description("Beach")]
    Beach = 3,
    [Description("Natural Wonder")]
    NaturalWonder = 4,
    [Description("Historical Site")]
    HistoricalSite = 5,
    [Description("Temple")]
    Temple = 6,
    [Description("Market")]
    Market = 7,
    [Description("Restaurant")]
    Restaurant = 8,
    [Description("Hotel")]
    Hotel = 9,
    [Description("Airport")]
    Airport = 10,
    [Description("Train Station")]
    TrainStation = 11,
    [Description("Bus Station")]
    BusStation = 12,
    [Description("Other")]
    Other = 99
}
