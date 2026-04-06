using System.ComponentModel;

namespace Domain.Enums;

public enum TransportType
{
    [Description("Airplane")]
    Airplane = 1,

    [Description("Bus")]
    Bus = 2,

    [Description("Train")]
    Train = 3,

    [Description("Ship")]
    Ship = 4,

    [Description("Car")]
    Car = 5,

    [Description("Other")]
    Other = 99
}
