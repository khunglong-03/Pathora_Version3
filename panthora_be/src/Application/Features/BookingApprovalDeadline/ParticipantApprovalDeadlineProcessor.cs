using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using Domain.UnitOfWork;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Data;

namespace Application.Features.BookingApprovalDeadline;

public sealed class ParticipantApprovalDeadlineProcessor(
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IMailRepository mailRepository,
    IConfiguration configuration,
    ILogger<ParticipantApprovalDeadlineProcessor> logger)
{
    private const int MaxBatchPerTick = 200;

    private static bool HasUnapprovedEntity(BookingEntity booking)
    {
        return booking.BookingParticipants.Any(p =>
            p.InfoReviewStatus == ParticipantInfoReviewStatus.NotReviewed
            || p.InfoReviewStatus == ParticipantInfoReviewStatus.Rejected
            || p.VisaApplications.Any(v => v.Status == VisaStatus.Pending || v.Status == VisaStatus.Rejected));
    }

    private static DateTimeOffset ComputeDeadlineUtc(TourInstanceEntity tour)
    {
        return tour.StartDate.ToUniversalTime().AddDays(-1);
    }

    public async Task<int> SendWarningsAsync(DateTimeOffset now, CancellationToken ct)
    {
        var nowUtc = now.UtcDateTime;
        // T-2 warning is in window [T-2, T-1]. Filter bookings whose TourInstance.StartDate <= nowUtc + 2 days
        var maxStartDate = nowUtc.AddDays(2).AddHours(1); // 1h buffer for clock skew

        var candidates = await bookingRepository.ListBookingsForApprovalWarningSweepAsync(nowUtc, maxStartDate, MaxBatchPerTick, ct);
        var sentCount = 0;

        foreach (var booking in candidates)
        {
            var deadline = ComputeDeadlineUtc(booking.TourInstance);
            if (deadline - nowUtc > TimeSpan.FromDays(2))
                continue;

            if (!HasUnapprovedEntity(booking))
                continue;

            sentCount += await TryMarkAndQueueWarningAsync(booking.Id, ct);
        }

        return sentCount;
    }

    private async Task<int> TryMarkAndQueueWarningAsync(Guid bookingId, CancellationToken ct)
    {
        var result = 0;
        try
        {
            await unitOfWork.ExecuteTransactionAsync(IsolationLevel.ReadCommitted, async () =>
            {
                var fresh = await bookingRepository.GetByIdWithDetailsAsync(bookingId, ct);
                if (fresh is null) return;
                if (fresh.ApprovalWarningSentAt is not null) return;
                if (fresh.ApprovalAutoCancelledAt is not null) return;

                var allowedStatuses = new[]
                {
                    BookingStatus.Pending,
                    BookingStatus.Confirmed,
                    BookingStatus.Deposited,
                    BookingStatus.Paid,
                    BookingStatus.PendingAdjustment
                };
                if (!allowedStatuses.Contains(fresh.Status)) return;
                if (!HasUnapprovedEntity(fresh)) return;

                fresh.MarkApprovalWarningSent("system");
                await bookingRepository.UpdateWithoutSaveAsync(fresh);

                var baseUrl = configuration["App:BaseUrl"] ?? "";
                var mailModel = ParticipantApprovalWarningMail.Compose(fresh, baseUrl);
                var mailEntity = mailModel.ToMail(fresh.CustomerEmail ?? "");
                await mailRepository.AddWithoutSaveAsync(mailEntity, ct);

                await unitOfWork.SaveChangeAsync(ct);
                result = 1;
            });
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger.LogInformation(ex, "Concurrency conflict during TryMarkAndQueueWarningAsync for booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during TryMarkAndQueueWarningAsync for booking {BookingId}", bookingId);
        }

        return result;
    }

    public async Task<int> AutoCancelExpiredAsync(DateTimeOffset now, CancellationToken ct)
    {
        var nowUtc = now.UtcDateTime;
        // T-1 cancel is when nowUtc >= deadline (StartDate - 1 day). Query tours starting up to nowUtc + 1 day + 1 hour (buffer)
        var maxStartDate = nowUtc.AddDays(1).AddHours(1);

        var candidates = await bookingRepository.ListBookingsForApprovalAutoCancelSweepAsync(nowUtc, maxStartDate, MaxBatchPerTick, ct);
        var cancelledCount = 0;

        foreach (var booking in candidates)
        {
            var deadline = ComputeDeadlineUtc(booking.TourInstance);
            if (nowUtc < deadline)
                continue;

            if (!HasUnapprovedEntity(booking))
                continue;

            cancelledCount += await TryAutoCancelAsync(booking.Id, ct);
        }

        return cancelledCount;
    }

    private async Task<int> TryAutoCancelAsync(Guid bookingId, CancellationToken ct)
    {
        var result = 0;
        try
        {
            await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
            {
                var fresh = await bookingRepository.GetByIdWithDetailsAsync(bookingId, ct);
                if (fresh is null) return;
                if (fresh.ApprovalAutoCancelledAt is not null) return;
                if (fresh.Status == BookingStatus.Cancelled || fresh.Status == BookingStatus.Completed) return;

                var deadline = ComputeDeadlineUtc(fresh.TourInstance);
                if (fresh.TourInstance.StartDate.ToUniversalTime() <= DateTimeOffset.UtcNow) return; // tour has already started
                if (DateTimeOffset.UtcNow < deadline) return; // not reached T-1 deadline yet
                if (!HasUnapprovedEntity(fresh)) return; // approved in the meantime

                if (fresh.Status == BookingStatus.PendingCancellation || fresh.Status == BookingStatus.PendingAdjustment)
                {
                    logger.LogWarning("Booking {BookingId} cancelled in status {Status} at deadline to prevent exploit.", fresh.Id, fresh.Status);
                }

                try
                {
                    fresh.AutoCancelDueToApprovalDeadline(
                        ErrorConstants.BookingApprovalDeadline.AutoCancelReasonCode,
                        "system");
                }
                catch (InvalidOperationException ex)
                {
                    logger.LogError(ex, "Invalid state transition during AutoCancelDueToApprovalDeadline for booking {BookingId}", bookingId);
                    return;
                }

                fresh.InitializeRefundTrackingWithAmount(0m, "system");
                await bookingRepository.UpdateWithoutSaveAsync(fresh);

                await unitOfWork.SaveChangeAsync(ct);
                result = 1;
            });
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger.LogInformation(ex, "Concurrency conflict during TryAutoCancelAsync for booking {BookingId}", bookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during TryAutoCancelAsync for booking {BookingId}", bookingId);
        }

        return result;
    }
}
