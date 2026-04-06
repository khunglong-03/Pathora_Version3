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
}
