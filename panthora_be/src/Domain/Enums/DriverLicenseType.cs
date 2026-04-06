namespace Domain.Enums;

/// <summary>
/// Vietnamese driver license categories (Decree 100/2019/ND-CP).
/// B1: Car <= 9 seats, weight <= 3.5T
/// B2: Car <= 9 seats, weight <= 3.5T (extended range)
/// C: Truck weight > 3.5T
/// D: Car > 9 seats
/// E: Car > 15 seats
/// F: Combined categories (add-on)
/// </summary>
public enum DriverLicenseType
{
    /// <summary>B1 — Car with <= 9 seats, max weight 3.5T. Valid for private use.</summary>
    B1 = 1,

    /// <summary>B2 — Car with <= 9 seats, max weight 3.5T. Valid for commercial transport within 300km.</summary>
    B2 = 2,

    /// <summary>C — Truck with weight > 3.5T. Required for driving large cargo vehicles.</summary>
    C = 3,

    /// <summary>D — Car with > 9 seats. Required for driving passenger vans and small buses.</summary>
    D = 4,

    /// <summary>E — Car with > 15 seats. Required for driving large buses.</summary>
    E = 5,

    /// <summary>F — Add-on licenses extending B2, C, D, or E to include trailers or larger vehicles.</summary>
    F = 6
}