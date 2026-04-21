using System.Text.Json;
using Application.Common.Constant;
using Application.Features.Tour.Commands.PurgeTour;
using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Repositories.Tour;

internal sealed class TourPurgeExecutor : ITourPurgeExecutor
{
    private readonly AppDbContext _context;
    private readonly IOutboxRepository _outboxRepository;
    private readonly ILogger<TourPurgeExecutor> _logger;

    public TourPurgeExecutor(AppDbContext context, IOutboxRepository outboxRepository, ILogger<TourPurgeExecutor> logger)
    {
        _context = context;
        _outboxRepository = outboxRepository;
        _logger = logger;
    }
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<PurgeResult> ExecuteAsync(Guid tourId, CancellationToken cancellationToken = default)
    {
        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            // Phase 0: Verify tour exists
            var tourExists = await _context.Tours.AnyAsync(t => t.Id == tourId, cancellationToken);
            if (!tourExists)
            {
                _logger.LogWarning("Tour {TourId} not found for purge", tourId);
                return PurgeResult.NotFound;
            }

            // Phase 0: Capture media object names
            var mediaObjectNames = await CaptureMediaObjectNamesAsync(tourId, cancellationToken);

            // Get TourInstance IDs for unlinking TourRequests
            var instanceIds = await _context.TourInstances
                .Where(i => i.TourId == tourId)
                .Select(i => i.Id)
                .ToListAsync(cancellationToken);

            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                // Phase 1: Unlink TourRequests
                if (instanceIds.Count > 0)
                {
                    await _context.TourRequests
                        .Where(r => r.TourInstanceId.HasValue && instanceIds.Contains(r.TourInstanceId.Value))
                        .ExecuteUpdateAsync(
                            s => s.SetProperty(r => r.TourInstanceId, (Guid?)null),
                            cancellationToken);
                }

                // Phase 2: Explicitly delete tables blocked by Restrict FKs
                var bookingIds = await _context.Bookings
                    .Where(b => instanceIds.Contains(b.TourInstanceId))
                    .Select(b => b.Id)
                    .ToListAsync(cancellationToken);

                if (bookingIds.Count > 0)
                {
                    await _context.BookingTourGuides
                        .Where(btg => bookingIds.Contains(btg.BookingId))
                        .ExecuteDeleteAsync(cancellationToken);
                }

                // Phase 3: Delete booking-related subtree
                if (bookingIds.Count > 0)
                {
                    await _context.CustomerPayments
                        .Where(cp => bookingIds.Contains(cp.BookingId))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.CustomerDeposits
                        .Where(cd => bookingIds.Contains(cd.BookingId))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.PaymentTransactions
                        .Where(pt => bookingIds.Contains(pt.BookingId))
                        .ExecuteDeleteAsync(cancellationToken);

                    var statusIds = await _context.TourDayActivityStatuses
                        .Where(s => bookingIds.Contains(s.BookingId))
                        .Select(s => s.Id)
                        .ToListAsync(cancellationToken);

                    if (statusIds.Count > 0)
                    {
                        await _context.TourDayActivityGuides
                            .Where(g => statusIds.Contains(g.TourDayActivityStatusId))
                            .ExecuteDeleteAsync(cancellationToken);

                        await _context.TourDayActivityStatuses
                            .Where(s => statusIds.Contains(s.Id))
                            .ExecuteDeleteAsync(cancellationToken);
                    }

                    await _context.BookingActivityReservations
                        .Where(r => bookingIds.Contains(r.BookingId))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.Bookings
                        .Where(b => bookingIds.Contains(b.Id))
                        .ExecuteDeleteAsync(cancellationToken);
                }

                // Phase 4: Delete TourInstance subtree
                if (instanceIds.Count > 0)
                {
                    await _context.TourInstanceDays
                        .Where(d => instanceIds.Contains(d.TourInstanceId))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.TourInstanceManagers
                        .Where(m => instanceIds.Contains(m.TourInstanceId))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.TourInstances
                        .Where(i => i.TourId == tourId)
                        .ExecuteDeleteAsync(cancellationToken);
                }

                // Phase 5: Delete tour-plan subtree
                var classificationIds = await _context.TourClassifications
                    .Where(c => c.TourId == tourId)
                    .Select(c => c.Id)
                    .ToListAsync(cancellationToken);

                if (classificationIds.Count > 0)
                {
                    var dayIds = await _context.TourDays
                        .Where(d => d.ClassificationId.HasValue && classificationIds.Contains(d.ClassificationId.Value))
                        .Select(d => d.Id)
                        .ToListAsync(cancellationToken);

                    if (dayIds.Count > 0)
                    {
                        await _context.TourDayActivities
                            .Where(a => dayIds.Contains(a.TourDayId))
                            .ExecuteDeleteAsync(cancellationToken);
                    }

                    await _context.TourDays
                        .Where(d => d.ClassificationId.HasValue && classificationIds.Contains(d.ClassificationId.Value))
                        .ExecuteDeleteAsync(cancellationToken);

                    await _context.TourClassifications
                        .Where(c => c.TourId == tourId)
                        .ExecuteDeleteAsync(cancellationToken);
                }

                // Phase 6: Delete direct Tour children and Tour row
                await _context.Reviews
                    .Where(r => r.TourId == tourId)
                    .ExecuteDeleteAsync(cancellationToken);

                await _context.TourResources
                    .Where(r => r.TourId == tourId)
                    .ExecuteDeleteAsync(cancellationToken);

                await _context.TourPlanLocations
                    .Where(l => l.TourId == tourId)
                    .ExecuteDeleteAsync(cancellationToken);

                await _context.Tours
                    .Where(t => t.Id == tourId)
                    .ExecuteDeleteAsync(cancellationToken);

                // Phase 7: Enqueue media cleanup message
                if (mediaObjectNames.Count > 0)
                {
                    var cleanupMessage = OutboxMessage.Create(
                        type: OutboxMessageTypeConstants.TourMediaCleanup,
                        payload: JsonSerializer.Serialize(new TourMediaCleanupPayload(tourId, mediaObjectNames), JsonOptions));

                    await _outboxRepository.AddAsync(cleanupMessage, cancellationToken);
                    _logger.LogInformation(
                        "Enqueued TourMediaCleanup message for tour {TourId} with {Count} media objects",
                        tourId, mediaObjectNames.Count);
                }

                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation("Successfully purged tour {TourId}", tourId);
                return PurgeResult.Success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging tour {TourId}", tourId);
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    private async Task<List<string>> CaptureMediaObjectNamesAsync(Guid tourId, CancellationToken cancellationToken)
    {
        var objectNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Batch load Tour media
        var tourData = await _context.Tours
            .Where(t => t.Id == tourId)
            .Select(t => new
            {
                ThumbnailId = t.Thumbnail.FileId,
                ImageIds = t.Images.Select(img => img.FileId).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (tourData != null)
        {
            if (!string.IsNullOrEmpty(tourData.ThumbnailId))
                objectNames.Add(tourData.ThumbnailId);

            foreach (var img in tourData.ImageIds)
            {
                if (!string.IsNullOrEmpty(img))
                    objectNames.Add(img!);
            }
        }

        // 2. Batch load all TourInstance media in ONE query
        var instanceMediaData = await _context.TourInstances
            .Where(i => i.TourId == tourId)
            .Select(i => new
            {
                ThumbnailId = i.Thumbnail.FileId,
                ImageIds = i.Images.Select(img => img.FileId).ToList()
            })
            .ToListAsync(cancellationToken);

        foreach (var data in instanceMediaData)
        {
            if (!string.IsNullOrEmpty(data.ThumbnailId))
                objectNames.Add(data.ThumbnailId);

            foreach (var img in data.ImageIds)
            {
                if (!string.IsNullOrEmpty(img))
                    objectNames.Add(img!);
            }
        }

        return objectNames.ToList();
    }
}

internal sealed record TourMediaCleanupPayload(Guid TourId, List<string> ObjectNames);
