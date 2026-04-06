using System.ComponentModel;

namespace Domain.Enums;

public enum SupplierType
{
    [Description("Transport")]
    Transport = 1,

    [Description("Accommodation")]
    Accommodation = 2,

    [Description("Restaurant")]
    Restaurant = 3,

    [Description("Activity")]
    Activity = 4,

    [Description("Insurance")]
    Insurance = 5,

    [Description("Other")]
    Other = 99
}
