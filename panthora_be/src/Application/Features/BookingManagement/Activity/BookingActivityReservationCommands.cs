using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Booking;
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

public sealed record CreateBookingActivityReservationCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("order")] int Order,
    [property: JsonPropertyName("activityType")] string ActivityType,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startTime")] DateTimeOffset? StartTime,
    [property: JsonPropertyName("endTime")] DateTimeOffset? EndTime,
    [property: JsonPropertyName("totalServicePrice")] decimal TotalServicePrice,
    [property: JsonPropertyName("totalServicePriceAfterTax")] decimal TotalServicePriceAfterTax,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class CreateBookingActivityReservationCommandValidator : AbstractValidator<CreateBookingActivityReservationCommand>
{
    public CreateBookingActivityReservationCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.Order).GreaterThan(0);
        RuleFor(x => x.ActivityType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.TotalServicePrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TotalServicePriceAfterTax).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime)
            .When(x => x.StartTime.HasValue && x.EndTime.HasValue);
    }
}

public sealed class CreateBookingActivityReservationCommandHandler(
    IBookingRepository bookingRepository,
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IUnitOfWork unitOfWork,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateBookingActivityReservationCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateBookingActivityReservationCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        if (!await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        var entity = BookingActivityReservationEntity.Create(
            request.BookingId,
            request.Order,
            request.ActivityType,
            request.Title,
            performedBy: performedBy,
            request.SupplierId,
            request.Description,
            request.StartTime,
            request.EndTime,
            request.TotalServicePrice,
            request.TotalServicePriceAfterTax,
            request.Note);

        await bookingActivityReservationRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateBookingActivityReservationCommand(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("order")] int Order,
    [property: JsonPropertyName("activityType")] string ActivityType,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startTime")] DateTimeOffset? StartTime,
    [property: JsonPropertyName("endTime")] DateTimeOffset? EndTime,
    [property: JsonPropertyName("totalServicePrice")] decimal? TotalServicePrice,
    [property: JsonPropertyName("totalServicePriceAfterTax")] decimal? TotalServicePriceAfterTax,
    [property: JsonPropertyName("status")] ReservationStatus? Status,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateBookingActivityReservationCommandValidator : AbstractValidator<UpdateBookingActivityReservationCommand>
{
    public UpdateBookingActivityReservationCommandValidator()
    {
        RuleFor(x => x.BookingActivityReservationId).NotEmpty();
        RuleFor(x => x.Order).GreaterThan(0);
        RuleFor(x => x.ActivityType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.TotalServicePrice).GreaterThanOrEqualTo(0).When(x => x.TotalServicePrice.HasValue);
        RuleFor(x => x.TotalServicePriceAfterTax).GreaterThanOrEqualTo(0).When(x => x.TotalServicePriceAfterTax.HasValue);
        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime)
            .When(x => x.StartTime.HasValue && x.EndTime.HasValue);
    }
}

public sealed class UpdateBookingActivityReservationCommandHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    IOwnershipValidator ownershipValidator,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateBookingActivityReservationCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateBookingActivityReservationCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var entity = await bookingActivityReservationRepository.GetByIdAsync(request.BookingActivityReservationId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingActivityReservation.NotFoundCode,
                ErrorConstants.BookingActivityReservation.NotFoundDescription.Resolve(lang));
        }

        var booking = await bookingRepository.GetByIdAsync(entity.BookingId);
        if (!await ownershipValidator.CanAccessAsync(booking?.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        entity.Update(
            request.Order,
            request.ActivityType,
            request.Title,
            performedBy: performedBy,
            request.SupplierId,
            request.Description,
            request.StartTime,
            request.EndTime,
            request.TotalServicePrice,
            request.TotalServicePriceAfterTax,
            request.Status,
            request.Note);

        bookingActivityReservationRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetBookingActivityReservationsQuery([property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<List<BookingActivityReservationDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:activity-reservations:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingActivityReservationsQueryHandler(
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingRepository bookingRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingActivityReservationsQuery, ErrorOr<List<BookingActivityReservationDto>>>
{
    public async Task<ErrorOr<List<BookingActivityReservationDto>>> Handle(GetBookingActivityReservationsQuery request, CancellationToken cancellationToken)
    {
        // Ownership validation
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        if (!await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        var entities = await bookingActivityReservationRepository.GetByBookingIdAsync(request.BookingId);

        return entities.Select(x => new BookingActivityReservationDto(
            x.Id,
            x.BookingId,
            x.SupplierId,
            x.Order,
            x.ActivityType,
            x.Title,
            x.Description,
            x.StartTime,
            x.EndTime,
            x.TotalServicePrice,
            x.TotalServicePriceAfterTax,
            x.Status,
            x.Note)).ToList();
    }
}
