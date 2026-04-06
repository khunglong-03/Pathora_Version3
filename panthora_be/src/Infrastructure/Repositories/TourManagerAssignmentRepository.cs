using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Contracts.ModelResponse;

namespace Infrastructure.Repositories;

public class TourManagerAssignmentRepository(AppDbContext context)
    : ITourManagerAssignmentRepository
{
    private readonly AppDbContext _context = context;

    public async Task<List<TourManagerAssignmentEntity>> GetAllSummariesAsync(CancellationToken cancellationToken)
    {
        return await _context.TourManagerAssignments
            .AsNoTracking()
            .AsSplitQuery()
            .Include(m => m.TourManager)
            .Include(m => m.AssignedUser)
            .Include(m => m.AssignedTour)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TourManagerAssignmentEntity>> GetByManagerIdAsync(
        Guid managerId,
        CancellationToken cancellationToken)
    {
        return await _context.TourManagerAssignments
            .AsNoTracking()
            .AsSplitQuery()
            .Include(m => m.TourManager)
            .Include(m => m.AssignedUser)
            .Include(m => m.AssignedTour)
            .Where(m => m.TourManagerId == managerId)
            .ToListAsync(cancellationToken);
    }

    public async Task AssignAsync(
        TourManagerAssignmentEntity assignment,
        CancellationToken cancellationToken)
    {
        await _context.TourManagerAssignments.AddAsync(assignment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BulkUpsertAsync(
        Guid managerId,
        List<TourManagerAssignmentEntity> newAssignments,
        string performedBy,
        CancellationToken cancellationToken)
    {
        var existing = await _context.TourManagerAssignments
            .Where(m => m.TourManagerId == managerId)
            .ToListAsync(cancellationToken);

        if (newAssignments.Count > 0)
        {
            foreach (var assignment in newAssignments)
            {
                assignment.CreatedBy = performedBy;
                assignment.CreatedOnUtc = DateTimeOffset.UtcNow;
            }
            await _context.TourManagerAssignments.AddRangeAsync(newAssignments, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }

        if (existing.Count > 0)
        {
            _context.TourManagerAssignments.RemoveRange(existing);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RemoveAsync(
        Guid managerId,
        Guid? assignedUserId,
        Guid? assignedTourId,
        AssignedEntityType entityType,
        CancellationToken cancellationToken)
    {
        var assignment = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(m =>
                m.TourManagerId == managerId &&
                m.AssignedUserId == assignedUserId &&
                m.AssignedTourId == assignedTourId &&
                m.AssignedEntityType == entityType,
                cancellationToken);

        if (assignment != null)
        {
            _context.TourManagerAssignments.Remove(assignment);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RemoveByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var assignment = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (assignment != null)
        {
            _context.TourManagerAssignments.Remove(assignment);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<int> CountPendingTourRequestsAsync(CancellationToken cancellationToken)
    {
        return await _context.TourRequests
            .AsNoTracking()
            .Where(tr => tr.Status == TourRequestStatus.Pending)
            .CountAsync(cancellationToken);
    }

    public async Task<List<ActivityItemDto>> GetRecentActivityAsync(int limit, CancellationToken cancellationToken)
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .OrderByDescending(b => b.CreatedOnUtc)
            .Take(limit)
            .Select(b => new ActivityItemDto(
                "booking_created",
                $"Booking created for {(b.TourInstance != null ? b.TourInstance.TourName : "Tour")}",
                b.CreatedOnUtc))
            .ToListAsync(cancellationToken);

        return bookings;
    }
}
