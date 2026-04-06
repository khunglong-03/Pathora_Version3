namespace Api.Endpoint;

public static class TourInstanceEndpoint
{
    public const string Base = "api/tour-instance";
    public const string Id = "{id:guid}";
    public const string Stats = "stats";
    public const string ChangeStatus = "{id:guid}/status";
    public const string CheckDuplicate = "check-duplicate";
    public const string Days = "{id:guid}/days";
    public const string DayId = "{id:guid}/days/{dayId:guid}";
    public const string Activities = "{id:guid}/days/{dayId:guid}/activities";
    public const string ActivityId = "{id:guid}/days/{dayId:guid}/activities/{activityId:guid}";
}
