using System.ComponentModel;

namespace Domain.Enums;

public enum MealType
{
    [Description("None")]
    None = 0,
    [Description("Breakfast")]
    Breakfast = 1,
    [Description("Lunch")]
    Lunch = 2,
    [Description("Dinner")]
    Dinner = 3,
    [Description("Breakfast and Lunch")]
    BreakfastAndLunch = 4,
    [Description("Breakfast and Dinner")]
    BreakfastAndDinner = 5,
    [Description("Lunch and Dinner")]
    LunchAndDinner = 6,
    [Description("All Meals")]
    AllMeals = 7
}
