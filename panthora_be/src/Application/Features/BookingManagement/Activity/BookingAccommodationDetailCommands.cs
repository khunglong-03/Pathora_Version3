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
using IHotelRoomInventoryRepository = Domain.Common.Repositories.IHotelRoomInventoryRepository;
using IRoomBlockRepository = Domain.Common.Repositories.IRoomBlockRepository;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Activity;
public sealed record CreateAccommodationDetailCommand(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCount")] int RoomCount,
    [property: JsonPropertyName("bedType")] string? BedType,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("checkInAt")] DateTimeOffset? CheckInAt,
    [property: JsonPropertyName("checkOutAt")] DateTimeOffset? CheckOutAt,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("confirmationCode")] string? ConfirmationCode,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
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
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IRoomBlockRepository roomBlockRepository,
    IHotelRoomInventoryRepository hotelRoomInventoryRepository,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateAccommodationDetailCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateAccommodationDetailCommand request, CancellationToken cancellationToken)
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
            performedBy: performedBy,
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

        // Room blocking: validate availability and create blocks if inventory exists
        if (request.SupplierId.HasValue && request.CheckInAt.HasValue && request.CheckOutAt.HasValue)
        {
            var inventory = await hotelRoomInventoryRepository.FindByHotelAndRoomTypeAsync(
                request.SupplierId.Value,
                request.RoomType);

            if (inventory is not null)
            {
                var checkIn = DateOnly.FromDateTime(request.CheckInAt.Value.DateTime);
                var checkOut = DateOnly.FromDateTime(request.CheckOutAt.Value.DateTime);
                var date = checkIn;

                while (date < checkOut)
                {
                    var blockedCount = await roomBlockRepository.GetBlockedRoomCountAsync(
                        request.SupplierId.Value,
                        request.RoomType,
                        date,
                        null,
                        cancellationToken);

                    if (inventory.TotalRooms - blockedCount < request.RoomCount)
                    {
                        return Error.Validation(
                            ErrorConstants.Booking.RoomCapacityExceededCode,
                            $"Khong du phong cho loai phong {request.RoomType} vao ngay {date}.");
                    }

                    date = date.AddDays(1);
                }

                // Recreate blocks after validation passes
                date = checkIn;
                var blocksToAdd = new List<RoomBlockEntity>();

                while (date < checkOut)
                {
                    var block = RoomBlockEntity.Create(
                        request.SupplierId.Value,
                        request.RoomType,
                        date,
                        request.RoomCount,
                        performedBy,
                        entity.Id,
                        activity.BookingId);

                    blocksToAdd.Add(block);
                    date = date.AddDays(1);
                }

                await roomBlockRepository.AddRangeAsync(blocksToAdd);
            }
        }

        await bookingAccommodationDetailRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateAccommodationDetailCommand(
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCount")] int? RoomCount,
    [property: JsonPropertyName("bedType")] string? BedType,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("checkInAt")] DateTimeOffset? CheckInAt,
    [property: JsonPropertyName("checkOutAt")] DateTimeOffset? CheckOutAt,
    [property: JsonPropertyName("buyPrice")] decimal? BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal? TaxRate,
    [property: JsonPropertyName("isTaxable")] bool? IsTaxable,
    [property: JsonPropertyName("confirmationCode")] string? ConfirmationCode,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("status")] ReservationStatus? Status,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IRoomBlockRepository roomBlockRepository,
    IHotelRoomInventoryRepository hotelRoomInventoryRepository,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateAccommodationDetailCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateAccommodationDetailCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
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

        var booking = await bookingRepository.GetByIdAsync(activity.BookingId);
        if (!await ownershipValidator.CanAccessAsync(booking?.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
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
            performedBy: performedBy,
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

        // Room blocking: handle date or room count changes
        var hasDateChange = request.CheckInAt.HasValue || request.CheckOutAt.HasValue || request.RoomCount.HasValue || request.SupplierId.HasValue || request.RoomType != default;
        if (hasDateChange)
        {
            var effectiveSupplierId = request.SupplierId ?? entity.SupplierId;
            var effectiveCheckIn = request.CheckInAt ?? entity.CheckInAt;
            var effectiveCheckOut = request.CheckOutAt ?? entity.CheckOutAt;
            var effectiveRoomCountForBlocks = request.RoomCount ?? entity.RoomCount;
            var effectiveRoomType = request.RoomType != default ? request.RoomType : entity.RoomType;

            // Delete existing blocks for this detail
            await roomBlockRepository.DeleteByBookingAccommodationDetailIdAsync(entity.Id);

            // Recreate blocks if supplier and dates are available
            if (effectiveSupplierId.HasValue && effectiveCheckIn.HasValue && effectiveCheckOut.HasValue)
            {
                var inventory = await hotelRoomInventoryRepository.FindByHotelAndRoomTypeAsync(
                    effectiveSupplierId.Value,
                    effectiveRoomType);

                if (inventory is not null)
                {
                    var checkIn = DateOnly.FromDateTime(effectiveCheckIn.Value.DateTime);
                    var checkOut = DateOnly.FromDateTime(effectiveCheckOut.Value.DateTime);
                    var date = checkIn;

                    while (date < checkOut)
                    {
                        var blockedCount = await roomBlockRepository.GetBlockedRoomCountAsync(
                            effectiveSupplierId.Value,
                            effectiveRoomType,
                            date,
                            null,
                            cancellationToken);

                        if (inventory.TotalRooms - blockedCount < effectiveRoomCountForBlocks)
                        {
                            return Error.Validation(
                                ErrorConstants.Booking.RoomCapacityExceededCode,
                                $"Khong du phong cho loai phong {effectiveRoomType} vao ngay {date}.");
                        }

                        date = date.AddDays(1);
                    }

                    date = checkIn;
                    var blocksToAdd = new List<RoomBlockEntity>();

                    while (date < checkOut)
                    {
                        var block = RoomBlockEntity.Create(
                            effectiveSupplierId.Value,
                            effectiveRoomType,
                            date,
                            effectiveRoomCountForBlocks,
                            performedBy,
                            entity.Id,
                            activity.BookingId);

                        blocksToAdd.Add(block);
                        date = date.AddDays(1);
                    }

                    await roomBlockRepository.AddRangeAsync(blocksToAdd);
                }
            }
        }

        bookingAccommodationDetailRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetBookingAccommodationDetailsQuery([property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<List<AccommodationDetailDto>>>, ICacheable
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
