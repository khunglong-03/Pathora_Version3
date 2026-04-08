using System.ComponentModel;

namespace Domain.Enums;

/// <summary>
/// Maps to the Id field in role.json seed data.
/// Used internally for domain entities (e.g., BookingTourGuideEntity).
/// Note: Authorization decisions are based on role names (strings), not enum values.
/// </summary>
public enum AssignedRole
{
    [Description("TourManager")]
    TourManager = 2,

    [Description("TourDesigner")]
    TourDesigner = 3,

    [Description("TourGuide")]
    TourGuide = 4,

    [Description("TransportProvider")]
    TransportProvider = 6,

    [Description("HotelServiceProvider")]
    HotelServiceProvider = 7
}