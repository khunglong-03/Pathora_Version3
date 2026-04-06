using System.ComponentModel;

namespace Domain.Enums;

public enum AssignedRole
{
    [Description("TourManager")]
    TourManager = 1,

    [Description("TourDesigner")]
    TourDesigner = 2,

    [Description("TourGuide")]
    TourGuide = 3,

    [Description("TransportProvider")]
    TransportProvider = 4,

    [Description("HotelServiceProvider")]
    HotelServiceProvider = 5
}