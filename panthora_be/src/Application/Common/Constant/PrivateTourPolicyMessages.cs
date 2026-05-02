namespace Application.Common.Constant;

/// <summary>
/// Booking / payment copy for automated private-tour policy (task §6).
/// Fee deductions are not performed here — only legal/accounting-approved flows may charge penalties.
/// </summary>
public static class PrivateTourPolicyMessages
{
    public const string TopUpNotPaidByConfirmationDeadline =
        "Private tour top-up was not completed before the confirmation deadline.";

    public const string TopUpTransactionClosedByDeadline =
        "Top-up payment window closed after ConfirmationDeadline (policy §6).";

    /// <summary>Error code stored on <see cref="Domain.Entities.PaymentTransactionEntity"/> when the worker closes a stale top-up bill.</summary>
    public const string TopUpDeadlineErrorCode = "TOPUP_CONFIRMATION_DEADLINE";
}
