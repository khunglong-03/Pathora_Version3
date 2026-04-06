using System.ComponentModel;

namespace Domain.Enums;

public enum RoomType
{
    [Description("Single")]
    Single = 0,
    [Description("Double")]
    Double = 1,
    [Description("Twin")]
    Twin = 2,
    [Description("Triple")]
    Triple = 3,
    [Description("Family")]
    Family = 4,
    [Description("Suite")]
    Suite = 5,
    [Description("Dormitory")]
    Dormitory = 6,
    [Description("Villa")]
    Villa = 7,
    [Description("Other")]
    Other = 99
}
