namespace Application.Common.Constant;

public static partial class ErrorConstants
{
    public static class BookingApprovalDeadline
    {
        public const string NotEligibleCode = "BookingApprovalDeadline.NotEligible";
        public static readonly LocalizedMessage NotEligibleDescription =
            new("Booking không đủ điều kiện duyệt hạn chót.", "Booking is not eligible for deadline processing.");

        public const string AlreadyProcessedCode = "BookingApprovalDeadline.AlreadyProcessed";
        public static readonly LocalizedMessage AlreadyProcessedDescription =
            new("Hạn chót duyệt cho booking này đã được xử lý.", "Deadline processing for this booking has already been processed.");

        public const string AutoCancelReasonCode = "Booking.AutoCancel.ApprovalDeadlineMissed";
        public static readonly LocalizedMessage AutoCancelReasonDescription =
            new("Tự động huỷ — chưa duyệt thông tin/visa trước hạn", "Auto-cancelled — failed to approve participant info/visa before deadline");
    }
}
