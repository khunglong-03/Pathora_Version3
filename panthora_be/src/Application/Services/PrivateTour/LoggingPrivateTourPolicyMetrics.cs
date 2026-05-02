using Microsoft.Extensions.Logging;

namespace Application.Services.PrivateTour;

public sealed class LoggingPrivateTourPolicyMetrics(ILogger<LoggingPrivateTourPolicyMetrics> logger)
    : IPrivateTourPolicyMetrics
{
    public void RecordTopUpDeadlineForfeited(int instancesProcessed, int bookingsCancelled)
    {
        logger.LogInformation(
            "PrivateTourPolicy: top-up confirmation deadline — instances={Instances}, bookingsCancelled={Bookings}",
            instancesProcessed,
            bookingsCancelled);
    }
}
