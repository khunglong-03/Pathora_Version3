using System.ComponentModel;

namespace Domain.Enums;

public enum TourType
{
    [Description("Private")]
    Private = 1,
    [Description("Public")]
    Public = 2,
    [Description("Group")]
    Group = 3
}
