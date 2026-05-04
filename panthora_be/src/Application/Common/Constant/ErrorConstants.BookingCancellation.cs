using Application.Common.Constant;

/// <summary>
/// Error constants for the Booking Cancellation workflow.
/// Separated into its own file for maintainability.
/// </summary>
public static class BookingCancellationErrors
{
    public const string AlreadyDepartedCode = "BookingCancellation.AlreadyDeparted";
    public static readonly LocalizedMessage AlreadyDepartedDescription =
        new("Booking đã khởi hành, không thể yêu cầu hủy.", "The tour has already departed.");

    public const string AlreadyHasPendingRequestCode = "BookingCancellation.AlreadyHasPendingRequest";
    public static readonly LocalizedMessage AlreadyHasPendingRequestDescription =
        new("Đã có yêu cầu hủy đang chờ duyệt cho booking này.", "There is already a pending cancellation request for this booking.");

    public const string BookingNotEligibleCode = "BookingCancellation.BookingNotEligible";
    public static readonly LocalizedMessage BookingNotEligibleDescription =
        new("Booking không đủ điều kiện để yêu cầu hủy.", "This booking is not eligible for cancellation.");

    public const string NotOwnerCode = "BookingCancellation.NotOwner";
    public static readonly LocalizedMessage NotOwnerDescription =
        new("Bạn không phải chủ booking này.", "You are not the owner of this booking.");

    public const string PolicyNotFoundCode = "BookingCancellation.PolicyNotFound";
    public static readonly LocalizedMessage PolicyNotFoundDescription =
        new("Không tìm thấy chính sách hủy phù hợp.", "No matching cancellation policy found.");

    public const string RequestNotFoundCode = "BookingCancellation.RequestNotFound";
    public static readonly LocalizedMessage RequestNotFoundDescription =
        new("Không tìm thấy yêu cầu hủy.", "Cancellation request not found.");

    public const string RequestNotPendingCode = "BookingCancellation.RequestNotPending";
    public static readonly LocalizedMessage RequestNotPendingDescription =
        new("Yêu cầu hủy không còn chờ duyệt.", "The cancellation request is no longer pending.");

    public const string RequestNotApprovedCode = "BookingCancellation.RequestNotApproved";
    public static readonly LocalizedMessage RequestNotApprovedDescription =
        new("Yêu cầu hủy chưa được duyệt.", "The cancellation request has not been approved.");
}
