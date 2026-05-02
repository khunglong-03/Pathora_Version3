using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;

namespace Application.Features.VisaApplication.Queries;

// ─── DTOs ────────────────────────────────────────────────────────────────────

public sealed record PassportDto(
    Guid Id,
    string PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl);

public sealed record VisaApplicationSummaryDto(
    Guid Id,
    VisaStatus Status,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate,
    string? RefusalReason,
    string? VisaFileUrl,
    bool IsSystemAssisted,
    decimal? ServiceFee,
    bool ServiceFeePaid);

public sealed record VisaRequirementParticipantDto(
    Guid ParticipantId,
    string FullName,
    DateTimeOffset? DateOfBirth,
    bool RequiresVisa,
    bool MissingDateOfBirth,
    PassportDto? Passport,
    VisaApplicationSummaryDto? LatestVisaApplication,
    IReadOnlyList<string> AvailableActions);

public sealed record VisaRequirementResponse(
    Guid BookingId,
    Guid TourInstanceId,
    string TourStatus,
    bool IsVisaRequired,
    decimal VisaServiceFeeTotal,
    IReadOnlyList<VisaRequirementParticipantDto> Participants);

// ─── Query ───────────────────────────────────────────────────────────────────

public sealed record GetCustomerVisaRequirementsQuery(Guid BookingId)
    : IRequest<ErrorOr<VisaRequirementResponse>>;

// ─── Handler ─────────────────────────────────────────────────────────────────

public sealed class GetCustomerVisaRequirementsQueryHandler(
    IBookingRepository bookingRepository,
    IPassportRepository passportRepository,
    IVisaApplicationRepository visaApplicationRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetCustomerVisaRequirementsQuery, ErrorOr<VisaRequirementResponse>>
{
    public async Task<ErrorOr<VisaRequirementResponse>> Handle(
        GetCustomerVisaRequirementsQuery request,
        CancellationToken cancellationToken)
    {
        // Ownership guard
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        // Guest booking chưa link user → 403
        if (booking.UserId == null || booking.UserId != currentUserId)
            return Error.Forbidden("Booking.Forbidden", "Bạn không có quyền truy cập booking này.");

        var tourInstance = booking.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        var tour = tourInstance.Tour;
        var isVisaRequired = tour?.IsVisa == true;
        var departureDate = tourInstance.StartDate;

        var participantDtos = new List<VisaRequirementParticipantDto>();

        foreach (var participant in booking.BookingParticipants)
        {
            bool missingDob = !participant.DateOfBirth.HasValue;
            bool requiresVisa = true; // All participants require a visa regardless of age.

            // Load passport và visa applications
            var passport = await passportRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
            var visaApps = await visaApplicationRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
            var latestApp = visaApps
                .OrderByDescending(v => v.CreatedOnUtc)
                .FirstOrDefault();

            // Xác định actions có thể thực hiện
            var actions = BuildAvailableActions(requiresVisa, passport, latestApp);

            participantDtos.Add(new VisaRequirementParticipantDto(
                ParticipantId: participant.Id,
                FullName: participant.FullName ?? string.Empty,
                DateOfBirth: participant.DateOfBirth,
                RequiresVisa: requiresVisa,
                MissingDateOfBirth: missingDob,
                Passport: passport == null ? null : new PassportDto(
                    passport.Id,
                    passport.PassportNumber,
                    passport.Nationality,
                    passport.IssuedAt,
                    passport.ExpiresAt,
                    passport.FileUrl),
                LatestVisaApplication: latestApp == null ? null : new VisaApplicationSummaryDto(
                    latestApp.Id,
                    latestApp.Status,
                    latestApp.DestinationCountry,
                    latestApp.MinReturnDate,
                    latestApp.RefusalReason,
                    latestApp.VisaFileUrl,
                    latestApp.IsSystemAssisted,
                    latestApp.ServiceFee,
                    latestApp.ServiceFeePaidAt.HasValue),
                AvailableActions: actions));
        }

        return new VisaRequirementResponse(
            BookingId: booking.Id,
            TourInstanceId: tourInstance.Id,
            TourStatus: tourInstance.Status.ToString(),
            IsVisaRequired: isVisaRequired,
            VisaServiceFeeTotal: booking.VisaServiceFeeTotal,
            Participants: participantDtos);
    }


    private static IReadOnlyList<string> BuildAvailableActions(
        bool requiresVisa,
        PassportEntity? passport,
        VisaApplicationEntity? latestApp)
    {
        if (!requiresVisa) return [];

        var actions = new List<string>();

        if (latestApp == null)
        {
            if (passport != null)
            {
                actions.Add("submit_visa");
                actions.Add("request_support");
            }
            else
            {
                actions.Add("add_passport");
            }
        }
        else if (latestApp.Status == VisaStatus.Rejected)
        {
            actions.Add("resubmit_visa");
            actions.Add("request_support");
        }
        else if (latestApp.Status == VisaStatus.Pending && latestApp.IsSystemAssisted && latestApp.ServiceFee.HasValue && !latestApp.ServiceFeePaidAt.HasValue)
        {
            actions.Add("pay_visa_fee");
        }

        return actions;
    }
}
