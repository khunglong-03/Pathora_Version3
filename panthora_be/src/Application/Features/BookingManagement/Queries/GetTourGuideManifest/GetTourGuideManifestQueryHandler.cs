using Application.Common.Constant;
using Application.Features.BookingManagement.DTOs;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.BookingManagement.Queries.GetTourGuideManifest;

public sealed class GetTourGuideManifestQueryHandler(
    IBookingRepository bookingRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUser user,
    MediatR.IPublisher publisher)
    : IQueryHandler<GetTourGuideManifestQuery, ErrorOr<TourGuideManifestDto>>
{
    public async Task<ErrorOr<TourGuideManifestDto>> Handle(GetTourGuideManifestQuery request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra tour instance tồn tại
        var tourInstance = await tourInstanceRepository.FindById(request.TourInstanceId, asNoTracking: true, cancellationToken);
        if (tourInstance is null)
        {
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription.En);
        }

        if (tourInstance.EndDate < DateTimeOffset.UtcNow.AddDays(-7))
        {
            return Error.Conflict("TourGuideManifest.Expired", "This tour has ended more than 7 days ago.");
        }

        // 2. Kiểm tra quyền truy cập (Resource Authorization)
        var isAdminOrManager = user.Roles.Any(r =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase));

        if (!isAdminOrManager)
        {
            // Kiểm tra xem Hướng dẫn viên có được gán trực tiếp cho Tour Instance không
            var isAssignedToInstance = tourInstance.Managers.Any(m => 
                m.UserId == request.GuideUserId && m.Role == TourInstanceManagerRole.Guide);

            if (!isAssignedToInstance)
            {
                // Nếu không được gán trực tiếp cho Tour Instance, kiểm tra phân công ở cấp Booking
                var assignedGuides = await bookingTourGuideRepository.GetListAsync(
                    x => x.UserId == request.GuideUserId && x.Booking.TourInstanceId == request.TourInstanceId && x.Status != AssignmentStatus.Cancelled,
                    cancellationToken: cancellationToken);

                if (!assignedGuides.Any())
                {
                    return Error.Forbidden(ErrorConstants.TourGuideManifest.NotAuthorizedCode, ErrorConstants.TourGuideManifest.NotAuthorizedDescription.En);
                }
            }
        }

        // 3. Lấy tất cả bookings của tour instance
        var bookings = await bookingRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);
        var sortedBookings = bookings.OrderBy(b => b.CreatedOnUtc).ToList();

        // 4. Lọc bookings: Confirmed, Deposited, Paid, Completed, PendingAdjustment, PendingCancellation
        // và mapping sang whitelist DTO
        var activeStatuses = new HashSet<BookingStatus>
        {
            BookingStatus.Confirmed,
            BookingStatus.Deposited,
            BookingStatus.Paid,
            BookingStatus.Completed,
            BookingStatus.PendingAdjustment,
            BookingStatus.PendingCancellation
        };

        var bookingDtos = new List<TourGuideManifestBookingDto>();

        foreach (var b in sortedBookings)
        {
            if (!activeStatuses.Contains(b.Status))
            {
                continue;
            }

            // Lọc participants không bị huỷ
            var activeParticipants = b.BookingParticipants
                .Where(p => p.Status != ReservationStatus.Cancelled)
                .OrderBy(p => p.FullName)
                .Select(p => new TourGuideManifestParticipantDto(
                    ParticipantId: p.Id,
                    FullName: p.FullName,
                    ParticipantType: p.ParticipantType,
                    DateOfBirth: p.DateOfBirth,
                    Gender: p.Gender?.ToString(),
                    Nationality: p.Nationality
                ))
                .ToList();

            var referenceCode = "PATH-" + b.CreatedOnUtc.ToString("yyyy-MMdd-HHmm");

            bookingDtos.Add(new TourGuideManifestBookingDto(
                BookingId: b.Id,
                Reference: referenceCode,
                Adults: b.NumberAdult,
                Children: b.NumberChild,
                Infants: b.NumberInfant,
                Participants: activeParticipants
            ));
        }

        var manifestDto = new TourGuideManifestDto(
            TourInstanceId: request.TourInstanceId,
            GeneratedAt: DateTimeOffset.UtcNow,
            Bookings: bookingDtos
        );

        await publisher.Publish(new Domain.Events.TourGuideManifestViewedEvent(
            GuideUserId: request.GuideUserId,
            TourInstanceId: request.TourInstanceId,
            ViewedAt: DateTimeOffset.UtcNow,
            BookingIds: bookingDtos.Select(b => b.BookingId).ToList()
        ), cancellationToken);

        return manifestDto;
    }
}
