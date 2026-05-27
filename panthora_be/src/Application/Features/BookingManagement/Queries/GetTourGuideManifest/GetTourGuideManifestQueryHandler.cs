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
    IUser user)
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

        // 2. Kiểm tra quyền truy cập (Resource Authorization)
        var isAdminOrManager = user.Roles.Any(r =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase));

        if (!isAdminOrManager)
        {
            // Nếu không phải Admin/Manager, chỉ cho phép Guide thuộc team của tour instance này truy cập
            var assignedGuides = await bookingTourGuideRepository.GetListAsync(
                x => x.UserId == request.GuideUserId && x.Booking.TourInstanceId == request.TourInstanceId && x.Status != AssignmentStatus.Cancelled,
                cancellationToken: cancellationToken);

            if (!assignedGuides.Any())
            {
                return Error.Forbidden(ErrorConstants.TourGuideManifest.NotAuthorizedCode, ErrorConstants.TourGuideManifest.NotAuthorizedDescription.En);
            }
        }

        // 3. Lấy tất cả bookings của tour instance
        var bookings = await bookingRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);

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

        foreach (var b in bookings)
        {
            if (!activeStatuses.Contains(b.Status))
            {
                continue;
            }

            // Lọc participants không bị huỷ
            var activeParticipants = b.BookingParticipants
                .Where(p => p.Status != ReservationStatus.Cancelled)
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

        return manifestDto;
    }
}
