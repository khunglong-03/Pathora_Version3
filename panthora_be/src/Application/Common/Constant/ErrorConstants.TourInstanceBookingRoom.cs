namespace Application.Common.Constant;

public static class TourInstanceBookingRoomErrors
{
    public const string RoomCountExceedsGuestCountCode = "TourInstance.RoomAssignmentExceedsGuestCount";
    public const string RoomCountExceedsGuestCountDescription =
        "Tổng số phòng phân bổ ({{roomCount}}) không được vượt quá số khách của booking ({{guestCount}}).";
}
