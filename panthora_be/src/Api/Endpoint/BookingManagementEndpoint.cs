namespace Api.Endpoint;

public static class BookingManagementEndpoint
{
    public const string Base = "api/bookings";
    public const string BookingId = "{id:guid}";
    public const string ActivityId = "{activityId:guid}";

    public const string MyRecent = "my-recent";
    public const string Activities = "{id:guid}/activities";
    public const string ActivityDetail = "{id:guid}/activities/{activityId:guid}";
    public const string TransportDetails = "{id:guid}/transport-details";
    public const string AccommodationDetails = "{id:guid}/accommodation-details";
    public const string Participants = "{id:guid}/participants";
    public const string Payables = "{id:guid}/payables";
    public const string ActivityStatuses = "{id:guid}/activity-statuses";
    public const string ActivityStatusDetail = "{id:guid}/activity-statuses/{tourDayId:guid}";
    public const string ActivityStatusStart = "{id:guid}/activity-statuses/{tourDayId:guid}/start";
    public const string ActivityStatusComplete = "{id:guid}/activity-statuses/{tourDayId:guid}/complete";
    public const string ActivityStatusCancel = "{id:guid}/activity-statuses/{tourDayId:guid}/cancel";
    public const string Team = "{id:guid}/team";
    public const string TeamMember = "{id:guid}/team/{userId:guid}";
    public const string TeamMemberConfirm = "{id:guid}/team/{userId:guid}/confirm";
    public const string TeamTourManager = "{id:guid}/team/tour-manager";
    public const string TeamTourDesigners = "{id:guid}/team/tour-designers";
    public const string TeamTourGuides = "{id:guid}/team/tour-guides";
    public const string CheckoutPrice = "{id:guid}/checkout-price";
}
