namespace Domain.Enums;

/// <summary>
/// Vehicle types for ground transport (road vehicles only — airplane/train/boat not included).
/// </summary>
public enum VehicleType
{
    /// <summary>Standard 4-seat passenger car.</summary>
    Car = 1,

    /// <summary>Large bus (typically 40+ seats).</summary>
    Bus = 2,

    /// <summary>Small bus (typically 12–29 seats).</summary>
    Minibus = 3,

    /// <summary>Van (typically 8–15 seats, cargo-passenger mix).</summary>
    Van = 4,

    /// <summary>Long-distance coach (comfortable seating for intercity travel).</summary>
    Coach = 5,

    /// <summary>Two-wheeled motorized vehicle.</summary>
    Motorbike = 6
}