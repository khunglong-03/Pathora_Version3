namespace Api.Endpoint;

public static class BookingCancellationEndpoint
{
    public const string Base = "api/booking-cancellations";

    // Customer endpoints
    public const string Estimate = "estimate/{bookingId:guid}";
    public const string Request = "request";
    public const string MyRequests = "my-requests";

    // Manager endpoints
    public const string ManagerList = "manager/list";
    public const string Approve = "{requestId:guid}/approve";
    public const string Reject = "{requestId:guid}/reject";
    public const string ConfirmRefund = "{requestId:guid}/confirm-refund";
}
