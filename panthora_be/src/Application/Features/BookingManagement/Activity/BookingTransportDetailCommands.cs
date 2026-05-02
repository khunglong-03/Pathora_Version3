using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Activity;

public sealed record CreateTransportDetailCommand(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("bookingParticipantId")] Guid? BookingParticipantId,
    [property: JsonPropertyName("passengerName")] string? PassengerName,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("transportType")] TransportType TransportType,
    [property: JsonPropertyName("departureAt")] DateTimeOffset? DepartureAt,
    [property: JsonPropertyName("arrivalAt")] DateTimeOffset? ArrivalAt,
    [property: JsonPropertyName("ticketNumber")] string? TicketNumber,
    [property: JsonPropertyName("eTicketNumber")] string? ETicketNumber,
    [property: JsonPropertyName("seatNumber")] string? SeatNumber,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("seatClass")] string? SeatClass,
    [property: JsonPropertyName("vehicleNumber")] string? VehicleNumber,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class TransportDetailValidator : AbstractValidator<CreateTransportDetailCommand>
{
    public TransportDetailValidator()
    {
        RuleFor(x => x.BookingActivityReservationId).NotEmpty();
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxRate).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SeatCapacity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ArrivalAt)
            .GreaterThan(x => x.DepartureAt)
            .When(x => x.DepartureAt.HasValue && x.ArrivalAt.HasValue);
        // Per-participant ticket: for external transport types, passengerName is recommended
        RuleFor(x => x.PassengerName)
            .MaximumLength(200);
    }
}

public sealed class CreateTransportDetailCommandHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingTransportDetailRepository bookingTransportDetailRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateTransportDetailCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTransportDetailCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var activity = await bookingActivityReservationRepository.GetByIdAsync(request.BookingActivityReservationId);
        if (activity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingActivityReservation.NotFoundCode,
                ErrorConstants.BookingActivityReservation.NotFoundDescription.Resolve(lang));
        }

        var booking = await bookingRepository.GetByIdAsync(activity.BookingId);
        if (!await ownershipValidator.CanAccessAsync(booking?.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        if (request.SeatCapacity > 0)
        {
            var participants = await bookingParticipantRepository.GetByBookingIdAsync(activity.BookingId);
            var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);

            if (activeParticipantCount > request.SeatCapacity)
            {
                return Error.Validation(
                    ErrorConstants.Booking.SeatCapacityExceededCode,
                    ErrorConstants.Booking.SeatCapacityExceededDescriptionTemplate.Format(
                        lang,
                        activeParticipantCount,
                        request.SeatCapacity));
            }
        }

        var entity = BookingTransportDetailEntity.Create(
            request.BookingActivityReservationId,
            request.TransportType,
            performedBy: performedBy,
            request.SupplierId,
            request.BookingParticipantId,
            request.PassengerName,
            request.DepartureAt,
            request.ArrivalAt,
            request.TicketNumber,
            request.ETicketNumber,
            request.SeatNumber,
            request.SeatCapacity,
            request.SeatClass,
            request.VehicleNumber,
            request.BuyPrice,
            request.TaxRate,
            request.IsTaxable,
            request.FileUrl,
            request.SpecialRequest,
            request.Note);

        await bookingTransportDetailRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateTransportDetailCommand(
    [property: JsonPropertyName("bookingTransportDetailId")] Guid BookingTransportDetailId,
    [property: JsonPropertyName("bookingParticipantId")] Guid? BookingParticipantId,
    [property: JsonPropertyName("passengerName")] string? PassengerName,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("transportType")] TransportType TransportType,
    [property: JsonPropertyName("departureAt")] DateTimeOffset? DepartureAt,
    [property: JsonPropertyName("arrivalAt")] DateTimeOffset? ArrivalAt,
    [property: JsonPropertyName("ticketNumber")] string? TicketNumber,
    [property: JsonPropertyName("eTicketNumber")] string? ETicketNumber,
    [property: JsonPropertyName("seatNumber")] string? SeatNumber,
    [property: JsonPropertyName("seatCapacity")] int? SeatCapacity,
    [property: JsonPropertyName("seatClass")] string? SeatClass,
    [property: JsonPropertyName("vehicleNumber")] string? VehicleNumber,
    [property: JsonPropertyName("buyPrice")] decimal? BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal? TaxRate,
    [property: JsonPropertyName("isTaxable")] bool? IsTaxable,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("status")] ReservationStatus? Status,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateTransportDetailCommandValidator : AbstractValidator<UpdateTransportDetailCommand>
{
    public UpdateTransportDetailCommandValidator()
    {
        RuleFor(x => x.BookingTransportDetailId).NotEmpty();
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0).When(x => x.BuyPrice.HasValue);
        RuleFor(x => x.TaxRate).GreaterThanOrEqualTo(0).When(x => x.TaxRate.HasValue);
        RuleFor(x => x.SeatCapacity).GreaterThanOrEqualTo(0).When(x => x.SeatCapacity.HasValue);
        RuleFor(x => x.ArrivalAt)
            .GreaterThan(x => x.DepartureAt)
            .When(x => x.DepartureAt.HasValue && x.ArrivalAt.HasValue);
    }
}

public sealed class UpdateTransportDetailCommandHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingTransportDetailRepository bookingTransportDetailRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateTransportDetailCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTransportDetailCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var entity = await bookingTransportDetailRepository.GetByIdAsync(request.BookingTransportDetailId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTransportDetail.NotFoundCode,
                ErrorConstants.BookingTransportDetail.NotFoundDescription.Resolve(lang));
        }

        var activity = await bookingActivityReservationRepository.GetByIdAsync(entity.BookingActivityReservationId);
        if (activity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingActivityReservation.NotFoundCode,
                ErrorConstants.BookingActivityReservation.NotFoundDescription.Resolve(lang));
        }

        var booking = await bookingRepository.GetByIdAsync(activity.BookingId);
        if (!await ownershipValidator.CanAccessAsync(booking?.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        var effectiveSeatCapacity = request.SeatCapacity ?? entity.SeatCapacity;
        if (effectiveSeatCapacity > 0)
        {
            var participants = await bookingParticipantRepository.GetByBookingIdAsync(activity.BookingId);
            var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);

            if (activeParticipantCount > effectiveSeatCapacity)
            {
                return Error.Validation(
                    ErrorConstants.Booking.SeatCapacityExceededCode,
                    ErrorConstants.Booking.SeatCapacityExceededDescriptionTemplate.Format(
                        lang,
                        activeParticipantCount,
                        effectiveSeatCapacity));
            }
        }

        entity.Update(
            request.TransportType,
            performedBy: performedBy,
            request.SupplierId,
            request.BookingParticipantId,
            request.PassengerName,
            request.DepartureAt,
            request.ArrivalAt,
            request.TicketNumber,
            request.ETicketNumber,
            request.SeatNumber,
            request.SeatCapacity,
            request.SeatClass,
            request.VehicleNumber,
            request.BuyPrice,
            request.TaxRate,
            request.IsTaxable,
            request.FileUrl,
            request.SpecialRequest,
            request.Status,
            request.Note);

        bookingTransportDetailRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetBookingTransportDetailsQuery(
    [property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<List<TransportDetailDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:transport-details:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingTransportDetailsQueryHandler(
    IBookingRepository bookingRepository,
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingTransportDetailRepository bookingTransportDetailRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingTransportDetailsQuery, ErrorOr<List<TransportDetailDto>>>
{
    public async Task<ErrorOr<List<TransportDetailDto>>> Handle(GetBookingTransportDetailsQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        if (!await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        var activities = await bookingActivityReservationRepository.GetByBookingIdAsync(request.BookingId);

        var result = new List<TransportDetailDto>();
        foreach (var activity in activities)
        {
            var details = await bookingTransportDetailRepository.GetByBookingActivityReservationIdAsync(activity.Id);
            result.AddRange(details.Select(ToDto));
        }

        return result;
    }

    private static TransportDetailDto ToDto(BookingTransportDetailEntity entity)
    {
        return new TransportDetailDto(
            entity.Id,
            entity.BookingActivityReservationId,
            entity.BookingParticipantId,
            entity.PassengerName,
            entity.SupplierId,
            entity.TransportType,
            entity.DepartureAt,
            entity.ArrivalAt,
            entity.TicketNumber,
            entity.ETicketNumber,
            entity.SeatNumber,
            entity.SeatCapacity,
            entity.SeatClass,
            entity.VehicleNumber,
            entity.BuyPrice,
            entity.TaxRate,
            entity.TotalBuyPrice,
            entity.IsTaxable,
            entity.FileUrl,
            entity.SpecialRequest,
            entity.Status,
            entity.Note);
    }
}
