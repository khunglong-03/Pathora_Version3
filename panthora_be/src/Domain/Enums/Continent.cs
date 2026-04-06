using System.ComponentModel;

namespace Domain.Enums;

public enum Continent
{
    [Description("Châu Á")]
    Asia = 1,

    [Description("Châu Âu")]
    Europe = 2,

    [Description("Châu Phi")]
    Africa = 3,

    [Description("Châu Mỹ")]
    Americas = 4,

    [Description("Châu Đại Dương")]
    Oceania = 5,

    [Description("Châu Nam Cực")]
    Antarctica = 6
}