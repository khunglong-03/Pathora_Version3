namespace Application.Services.PrivateTour;

/// <summary>
/// Lightweight observability hook for private-tour policy (OpenSpec §6.3–6.4). Replace with APM/analytics when ready.
/// </summary>
public interface IPrivateTourPolicyMetrics
{
    /// <summary>Emitted when bookings are auto-cancelled because top-up was not paid by <c>ConfirmationDeadline</c>.</summary>
    void RecordTopUpDeadlineForfeited(int instancesProcessed, int bookingsCancelled);
}
