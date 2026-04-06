using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Common;
using Application.Services;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;

namespace Application.Features.BookingManagement.Activity;

public sealed record CreateAccommodationDetailCommand(
    Guid BookingActivityReservationId,
    Guid? SupplierId,
    string AccommodationName,
    RoomType RoomType,
    int RoomCount,
    string? BedType,
    string? Address,
    string? ContactPhone,
    DateTimeOffset? CheckInAt,
    DateTimeOffset? CheckOutAt,
    decimal BuyPrice,
    decimal TaxRate,
    bool IsTaxable,
    string? ConfirmationCode,
    string? FileUrl,
    string? SpecialRequest,
    string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class AccommodationDetailValidator : AbstractValidator<CreateAccommodationDetailCommand>
{
    public AccommodationDetailValidator()
    {
        RuleFor(x => x.BookingActivityReservationId).NotEmpty();
        RuleFor(x => x.AccommodationName).NotEmpty().MaximumLength(300);
        RuleFor(x => x.RoomCount).GreaterThan(0);
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TaxRate).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CheckOutAt)
            .GreaterThan(x => x.CheckInAt)
            .When(x => x.CheckInAt.HasValue && x.CheckOutAt.HasValue);
    }
}

public sealed class CreateAccommodationDetailCommandHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateAccommodationDetailCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateAccommodationDetailCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var activity = await bookingActivityReservationRepository.GetByIdAsync(request.BookingActivityReservationId);
        if (activity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingActivityReservation.NotFoundCode,
                ErrorConstants.BookingActivityReservation.NotFoundDescription.Resolve(lang));
        }

        var participants = await bookingParticipantRepository.GetByBookingIdAsync(activity.BookingId);
        var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);
        var roomCapacity = BookingCapacityValidation.CalculateRoomCapacity(request.RoomType, request.RoomCount);

        if (activeParticipantCount > roomCapacity)
        {
            return Error.Validation(
                ErrorConstants.Booking.RoomCapacityExceededCode,
                ErrorConstants.Booking.RoomCapacityExceededDescriptionTemplate.Format(
                    lang,
                    activeParticipantCount,
                    roomCapacity));
        }

        var entity = BookingAccommodationDetailEntity.Create(
            request.BookingActivityReservationId,
            request.AccommodationName,
            request.RoomType,
            performedBy: "system",
            request.RoomCount,
            request.SupplierId,
            request.BedType,
            request.Address,
            request.ContactPhone,
            request.CheckInAt,
            request.CheckOutAt,
            request.BuyPrice,
            request.TaxRate,
            request.IsTaxable,
            request.ConfirmationCode,
            request.FileUrl,
            request.SpecialRequest,
            request.Note);

        await bookingAccommodationDetailRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateAccommodationDetailCommand(
    Guid BookingAccommodationDetailId,
    Guid? SupplierId,
    string AccommodationName,
    RoomType RoomType,
    int? RoomCount,
    string? BedType,
    string? Address,
    string? ContactPhone,
    DateTimeOffset? CheckInAt,
    DateTimeOffset? CheckOutAt,
    decimal? BuyPrice,
    decimal? TaxRate,
    bool? IsTaxable,
    string? ConfirmationCode,
    string? FileUrl,
    string? SpecialRequest,
    ReservationStatus? Status,
    string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateAccommodationDetailCommandValidator : AbstractValidator<UpdateAccommodationDetailCommand>
{
    public UpdateAccommodationDetailCommandValidator()
    {
        RuleFor(x => x.BookingAccommodationDetailId).NotEmpty();
        RuleFor(x => x.AccommodationName).NotEmpty().MaximumLength(300);
        RuleFor(x => x.RoomCount).GreaterThan(0).When(x => x.RoomCount.HasValue);
        RuleFor(x => x.BuyPrice).GreaterThanOrEqualTo(0).When(x => x.BuyPrice.HasValue);
        RuleFor(x => x.TaxRate).GreaterThanOrEqualTo(0).When(x => x.TaxRate.HasValue);
        RuleFor(x => x.CheckOutAt)
            .GreaterThan(x => x.CheckInAt)
            .When(x => x.CheckInAt.HasValue && x.CheckOutAt.HasValue);
    }
}

public sealed class UpdateAccommodationDetailCommandHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateAccommodationDetailCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateAccommodationDetailCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await bookingAccommodationDetailRepository.GetByIdAsync(request.BookingAccommodationDetailId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingAccommodationDetail.NotFoundCode,
                ErrorConstants.BookingAccommodationDetail.NotFoundDescription.Resolve(lang));
        }

        var activity = await bookingActivityReservationRepository.GetByIdAsync(entity.BookingActivityReservationId);
        if (activity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingActivityReservation.NotFoundCode,
                ErrorConstants.BookingActivityReservation.NotFoundDescription.Resolve(lang));
        }

        var participants = await bookingParticipantRepository.GetByBookingIdAsync(activity.BookingId);
        var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);
        var effectiveRoomCount = request.RoomCount ?? entity.RoomCount;
        var roomCapacity = BookingCapacityValidation.CalculateRoomCapacity(request.RoomType, effectiveRoomCount);

        if (activeParticipantCount > roomCapacity)
        {
            return Error.Validation(
                ErrorConstants.Booking.RoomCapacityExceededCode,
                ErrorConstants.Booking.RoomCapacityExceededDescriptionTemplate.Format(
                    lang,
                    activeParticipantCount,
                    roomCapacity));
        }

        entity.Update(
            request.AccommodationName,
            request.RoomType,
            performedBy: "system",
            request.RoomCount,
            request.SupplierId,
            request.BedType,
            request.Address,
            request.ContactPhone,
            request.CheckInAt,
            request.CheckOutAt,
            request.BuyPrice,
            request.TaxRate,
            request.IsTaxable,
            request.ConfirmationCode,
            request.FileUrl,
            request.SpecialRequest,
            request.Status,
            request.Note);

        bookingAccommodationDetailRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetBookingAccommodationDetailsQuery(Guid BookingId) : IQuery<ErrorOr<List<AccommodationDetailDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:accommodation-details:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingAccommodationDetailsQueryHandler(
    IBookingRepository bookingRepository,
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingAccommodationDetailsQuery, ErrorOr<List<AccommodationDetailDto>>>
{
    public async Task<ErrorOr<List<AccommodationDetailDto>>> Handle(GetBookingAccommodationDetailsQuery request, CancellationToken cancellationToken)
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

        var result = new List<AccommodationDetailDto>();
        foreach (var activity in activities)
        {
            var details = await bookingAccommodationDetailRepository.GetByBookingActivityReservationIdAsync(activity.Id);
            result.AddRange(details.Select(ToDto));
        }

        return result;
    }

    private static AccommodationDetailDto ToDto(BookingAccommodationDetailEntity entity)
    {
        return new AccommodationDetailDto(
            entity.Id,
            entity.BookingActivityReservationId,
            entity.SupplierId,
            entity.AccommodationName,
            entity.RoomType,
            entity.RoomCount,
            entity.BedType,
            entity.Address,
            entity.ContactPhone,
            entity.CheckInAt,
            entity.CheckOutAt,
            entity.BuyPrice,
            entity.TaxRate,
            entity.TotalBuyPrice,
            entity.IsTaxable,
            entity.ConfirmationCode,
            entity.FileUrl,
            entity.SpecialRequest,
            entity.Status,
            entity.Note);
    }
}
