using System.Linq;
using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourDayActivityRouteTransportRepository(AppDbContext context)
    : Repository<TourDayActivityRouteTransportEntity>(context),
      ITourDayActivityRouteTransportRepository
{
    public async Task<TourDayActivityRouteTransportEntity?> FindByBookingAndRouteAsync(
        Guid bookingActivityReservationId,
        Guid tourPlanRouteId,
        CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Vehicle)
            .FirstOrDefaultAsync(
                t => t.BookingActivityReservationId == bookingActivityReservationId && t.TourPlanRouteId == tourPlanRouteId,
                cancellationToken);
    }

    public async Task<TourDayActivityRouteTransportEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Vehicle)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<TourDayActivityRouteTransportEntity>> FindByBookingIdAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Vehicle)
            .Include(t => t.TourPlanRoute)
                .ThenInclude(r => r.TourDayActivity)
            .Where(t => t.BookingActivityReservation.BookingId == bookingId)
            .OrderBy(t => t.TourPlanRoute.Order)
            .ToListAsync(cancellationToken);
    }

    public async Task UpsertAsync(
        TourDayActivityRouteTransportEntity entity,
        CancellationToken cancellationToken = default)
    {
        var existing = await _context.TourDayActivityRouteTransports
            .FirstOrDefaultAsync(
                t => t.BookingActivityReservationId == entity.BookingActivityReservationId &&
                     t.TourPlanRouteId == entity.TourPlanRouteId,
                cancellationToken);

        if (existing != null)
        {
            existing.Assign(entity.DriverId, entity.VehicleId, entity.UpdatedById, entity.LastModifiedBy ?? "system");
            _context.TourDayActivityRouteTransports.Update(existing);
        }
        else
        {
            await _context.TourDayActivityRouteTransports.AddAsync(entity, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Domain.Enums.Continent?> GetTourContinentByRouteIdAsync(
        Guid tourPlanRouteId,
        CancellationToken cancellationToken = default)
    {
        var classificationId = await _context.TourPlanRoutes
            .AsNoTracking()
            .Where(r => r.Id == tourPlanRouteId)
            .Select(r => r.TourDayActivity.TourDay.ClassificationId)
            .FirstOrDefaultAsync(cancellationToken);

        if (classificationId == Guid.Empty)
            return null;

        return await _context.TourClassifications
            .AsNoTracking()
            .Where(c => c.Id == classificationId)
            .Select(c => c.Tour.Continent)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TourDayActivityRouteTransportEntity?> FindByIdWithTourAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Driver)
            .Include(t => t.Vehicle)
            .Include(t => t.TourPlanRoute)
                .ThenInclude(r => r.TourDayActivity)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<TourDayActivityRouteTransportEntity>> FindByOwnerIdAsync(
        Guid ownerId,
        int? statusFilter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Vehicle)
            .Include(t => t.Driver)
            .Include(t => t.BookingActivityReservation)
                .ThenInclude(b => b.Booking)
            .Include(t => t.TourPlanRoute)
            .Where(t =>
                (t.Vehicle != null && t.Vehicle.OwnerId == ownerId) ||
                (t.Driver != null && t.Driver.UserId == ownerId));

        if (statusFilter.HasValue)
        {
            query = query.Where(t => t.Status == statusFilter.Value);
        }

        return await query
            .OrderByDescending(t => t.CreatedOnUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<TourDayActivityRouteTransportEntity?> FindByIdWithDetailsAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Vehicle)
            .Include(t => t.Driver)
            .Include(t => t.BookingActivityReservation)
                .ThenInclude(b => b.Booking)
            .Include(t => t.TourPlanRoute)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<List<TourDayActivityRouteTransportEntity>> FindCompletedByOwnerIdAsync(
        Guid ownerId,
        int year,
        int? quarter,
        CancellationToken cancellationToken = default)
    {
        var startDate = new DateTimeOffset(year, 1, 1, 0, 0, 0, TimeSpan.Zero);
        var endDate = startDate.AddYears(1);

        var query = _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Vehicle)
            .Include(t => t.Driver)
            .Include(t => t.BookingActivityReservation)
            .Include(t => t.TourPlanRoute)
            .Where(t =>
                (t.Vehicle != null && t.Vehicle.OwnerId == ownerId) ||
                (t.Driver != null && t.Driver.UserId == ownerId))
            .Where(t => t.Status == 2);

        if (quarter.HasValue)
        {
            var (qStart, qEnd) = GetQuarterRange(year, quarter.Value);
            query = query.Where(t => t.UpdatedAt >= qStart && t.UpdatedAt < qEnd);
        }
        else
        {
            query = query.Where(t => t.UpdatedAt >= startDate && t.UpdatedAt < endDate);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<TourDayActivityRouteTransportEntity>> FindCompletedByOwnerIdPaginatedAsync(
        Guid ownerId,
        int? year,
        int? quarter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Include(t => t.Vehicle)
            .Include(t => t.Driver)
            .Include(t => t.BookingActivityReservation)
                .ThenInclude(b => b.Booking)
            .Include(t => t.TourPlanRoute)
            .Where(t =>
                (t.Vehicle != null && t.Vehicle.OwnerId == ownerId) ||
                (t.Driver != null && t.Driver.UserId == ownerId))
            .Where(t => t.Status == 2);

        if (year.HasValue)
        {
            var startDate = new DateTimeOffset(year.Value, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var endDate = startDate.AddYears(1);
            query = query.Where(t => t.UpdatedAt >= startDate && t.UpdatedAt < endDate);
        }

        if (quarter.HasValue && year.HasValue)
        {
            var (qStart, qEnd) = GetQuarterRange(year.Value, quarter.Value);
            query = query.Where(t => t.UpdatedAt >= qStart && t.UpdatedAt < qEnd);
        }

        return await query
            .OrderByDescending(t => t.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountCompletedByOwnerIdAsync(
        Guid ownerId,
        int? year,
        int? quarter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.TourDayActivityRouteTransports
            .AsNoTracking()
            .Where(t =>
                (t.Vehicle != null && t.Vehicle.OwnerId == ownerId) ||
                (t.Driver != null && t.Driver.UserId == ownerId))
            .Where(t => t.Status == 2);

        if (year.HasValue)
        {
            var startDate = new DateTimeOffset(year.Value, 1, 1, 0, 0, 0, TimeSpan.Zero);
            var endDate = startDate.AddYears(1);
            query = query.Where(t => t.UpdatedAt >= startDate && t.UpdatedAt < endDate);
        }

        if (quarter.HasValue && year.HasValue)
        {
            var (qStart, qEnd) = GetQuarterRange(year.Value, quarter.Value);
            query = query.Where(t => t.UpdatedAt >= qStart && t.UpdatedAt < qEnd);
        }

        return await query.CountAsync(cancellationToken);
    }

    private static (DateTimeOffset Start, DateTimeOffset End) GetQuarterRange(int year, int quarter)
    {
        var startMonth = (quarter - 1) * 3 + 1;
        var startDate = new DateTimeOffset(year, startMonth, 1, 0, 0, 0, TimeSpan.Zero);
        var endDate = startDate.AddMonths(3);
        return (startDate, endDate);
    }
}
