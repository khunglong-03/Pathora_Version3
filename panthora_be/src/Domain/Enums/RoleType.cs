using System.ComponentModel;

namespace Domain.Enums;

/// <summary>
/// Maps to the Type field in role.json seed data.
/// NOTE: This enum reflects the actual seed data values, NOT the spec.md values
/// (spec.md incorrectly listed: 4=Customer, 5=TransportProvider, 6=HotelServiceProvider).
/// This enum is currently unused in authorization logic. It is provided for future
/// role categorization needs.
/// </summary>
[Obsolete("This enum is unused in the authorization pipeline. Use role names from role.json instead. Will be removed in a future version.")]
public enum RoleType
{
    /// <summary>Administrator / System Admin (Type=9 in role.json)</summary>
    [Description("Admin")]
    SystemAdmin = 9,

    /// <summary>Operations Manager (Type=1 in role.json)</summary>
    [Description("Manager")]
    OperationsManager = 1,

    /// <summary>Content Creator (Type=2 in role.json). Shared by TourOperator, TourGuide, TransportProvider, and HotelServiceProvider.</summary>
    [Description("ContentCreator")]
    ContentCreator = 2,

    /// <summary>Customer (Type=3 in role.json)</summary>
    [Description("Customer")]
    Customer = 3,
}