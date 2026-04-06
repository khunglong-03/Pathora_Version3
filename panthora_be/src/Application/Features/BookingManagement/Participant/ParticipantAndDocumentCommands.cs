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

namespace Application.Features.BookingManagement.Participant;

public sealed record CreateParticipantCommand(
    Guid BookingId,
    string ParticipantType,
    string FullName,
    DateTimeOffset? DateOfBirth,
    GenderType? Gender,
    string? Nationality) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class CreateParticipantCommandValidator : AbstractValidator<CreateParticipantCommand>
{
    public CreateParticipantCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.ParticipantType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}

public sealed class CreateParticipantCommandHandler(
    IBookingRepository bookingRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingTransportDetailRepository bookingTransportDetailRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateParticipantCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateParticipantCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        var participants = await bookingParticipantRepository.GetByBookingIdAsync(request.BookingId);
        var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);
        var nextParticipantCount = activeParticipantCount + 1;

        var (seatCapacityLimit, roomCapacityLimit) = await BookingCapacityValidation.GetBookingCapacityLimitsAsync(
            request.BookingId,
            bookingActivityReservationRepository,
            bookingTransportDetailRepository,
            bookingAccommodationDetailRepository);

        if (seatCapacityLimit.HasValue && nextParticipantCount > seatCapacityLimit.Value)
        {
            return Error.Validation(
                ErrorConstants.Booking.SeatCapacityExceededCode,
                ErrorConstants.Booking.SeatCapacityExceededDescriptionTemplate.Format(
                    lang,
                    nextParticipantCount,
                    seatCapacityLimit.Value));
        }

        if (roomCapacityLimit.HasValue && nextParticipantCount > roomCapacityLimit.Value)
        {
            return Error.Validation(
                ErrorConstants.Booking.RoomCapacityExceededCode,
                ErrorConstants.Booking.RoomCapacityExceededDescriptionTemplate.Format(
                    lang,
                    nextParticipantCount,
                    roomCapacityLimit.Value));
        }

        var entity = BookingParticipantEntity.Create(
            request.BookingId,
            request.ParticipantType,
            request.FullName,
            performedBy: "system",
            request.DateOfBirth,
            request.Gender,
            request.Nationality);

        await bookingParticipantRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateParticipantCommand(
    Guid ParticipantId,
    string ParticipantType,
    string FullName,
    DateTimeOffset? DateOfBirth,
    GenderType? Gender,
    string? Nationality,
    ReservationStatus? Status) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateParticipantCommandValidator : AbstractValidator<UpdateParticipantCommand>
{
    public UpdateParticipantCommandValidator()
    {
        RuleFor(x => x.ParticipantId).NotEmpty();
        RuleFor(x => x.ParticipantType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}

public sealed class UpdateParticipantCommandHandler(
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingActivityReservationRepository bookingActivityReservationRepository,
    IBookingTransportDetailRepository bookingTransportDetailRepository,
    IBookingAccommodationDetailRepository bookingAccommodationDetailRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateParticipantCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateParticipantCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await bookingParticipantRepository.GetByIdAsync(request.ParticipantId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingParticipant.NotFoundCode,
                ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
        }

        var participants = await bookingParticipantRepository.GetByBookingIdAsync(entity.BookingId);
        var activeParticipantCount = BookingCapacityValidation.CountActiveParticipants(participants);
        var nextStatus = request.Status ?? entity.Status;
        var nextParticipantCount = activeParticipantCount;

        if (entity.Status == ReservationStatus.Cancelled && nextStatus != ReservationStatus.Cancelled)
        {
            nextParticipantCount += 1;
        }
        else if (entity.Status != ReservationStatus.Cancelled && nextStatus == ReservationStatus.Cancelled)
        {
            nextParticipantCount -= 1;
        }

        var (seatCapacityLimit, roomCapacityLimit) = await BookingCapacityValidation.GetBookingCapacityLimitsAsync(
            entity.BookingId,
            bookingActivityReservationRepository,
            bookingTransportDetailRepository,
            bookingAccommodationDetailRepository);

        if (seatCapacityLimit.HasValue && nextParticipantCount > seatCapacityLimit.Value)
        {
            return Error.Validation(
                ErrorConstants.Booking.SeatCapacityExceededCode,
                ErrorConstants.Booking.SeatCapacityExceededDescriptionTemplate.Format(
                    lang,
                    nextParticipantCount,
                    seatCapacityLimit.Value));
        }

        if (roomCapacityLimit.HasValue && nextParticipantCount > roomCapacityLimit.Value)
        {
            return Error.Validation(
                ErrorConstants.Booking.RoomCapacityExceededCode,
                ErrorConstants.Booking.RoomCapacityExceededDescriptionTemplate.Format(
                    lang,
                    nextParticipantCount,
                    roomCapacityLimit.Value));
        }

        entity.Update(
            request.ParticipantType,
            request.FullName,
            performedBy: "system",
            request.DateOfBirth,
            request.Gender,
            request.Nationality,
            request.Status);

        bookingParticipantRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record CreatePassportCommand(
    Guid BookingParticipantId,
    string PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class PassportValidator : AbstractValidator<CreatePassportCommand>
{
    public PassportValidator()
    {
        RuleFor(x => x.BookingParticipantId).NotEmpty();
        RuleFor(x => x.PassportNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class CreatePassportCommandHandler(
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingRepository bookingRepository,
    IPassportRepository passportRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreatePassportCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreatePassportCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var participant = await bookingParticipantRepository.GetByIdAsync(request.BookingParticipantId);
        if (participant is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingParticipant.NotFoundCode,
                ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
        }

        var booking = await bookingRepository.GetByIdAsync(participant.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        if (request.ExpiresAt.HasValue && request.ExpiresAt.Value <= booking.TourInstance.StartDate)
        {
            return Error.Validation(
                ErrorConstants.Passport.ExpiryBeforeTourStartCode,
                ErrorConstants.Passport.ExpiryBeforeTourStartDescription.Resolve(lang));
        }

        var existing = await passportRepository.GetByBookingParticipantIdAsync(request.BookingParticipantId);
        if (existing is not null)
        {
            return Error.Conflict(
                ErrorConstants.Passport.ExistsCode,
                ErrorConstants.Passport.ExistsDescription.Resolve(lang));
        }

        var entity = PassportEntity.Create(
            request.BookingParticipantId,
            request.PassportNumber,
            performedBy: "system",
            request.Nationality,
            request.IssuedAt,
            request.ExpiresAt,
            request.FileUrl);

        await passportRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdatePassportCommand(
    Guid PassportId,
    string PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdatePassportCommandValidator : AbstractValidator<UpdatePassportCommand>
{
    public UpdatePassportCommandValidator()
    {
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.PassportNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class UpdatePassportCommandHandler(
    IPassportRepository passportRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdatePassportCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdatePassportCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await passportRepository.GetByIdAsync(request.PassportId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.Passport.NotFoundCode,
                ErrorConstants.Passport.NotFoundDescription.Resolve(lang));
        }

        var participant = await bookingParticipantRepository.GetByIdAsync(entity.BookingParticipantId);
        if (participant is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingParticipant.NotFoundCode,
                ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
        }

        var booking = await bookingRepository.GetByIdAsync(participant.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        if (request.ExpiresAt.HasValue && request.ExpiresAt.Value <= booking.TourInstance.StartDate)
        {
            return Error.Validation(
                ErrorConstants.Passport.ExpiryBeforeTourStartCode,
                ErrorConstants.Passport.ExpiryBeforeTourStartDescription.Resolve(lang));
        }

        entity.Update(
            request.PassportNumber,
            performedBy: "system",
            request.Nationality,
            request.IssuedAt,
            request.ExpiresAt,
            request.FileUrl);

        passportRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record CreateVisaApplicationCommand(
    Guid BookingParticipantId,
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate,
    string? VisaFileUrl) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class VisaApplicationValidator : AbstractValidator<CreateVisaApplicationCommand>
{
    public VisaApplicationValidator()
    {
        RuleFor(x => x.BookingParticipantId).NotEmpty();
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.DestinationCountry).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateVisaApplicationCommandHandler(
    IBookingParticipantRepository bookingParticipantRepository,
    IPassportRepository passportRepository,
    IVisaApplicationRepository visaApplicationRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateVisaApplicationCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateVisaApplicationCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var participant = await bookingParticipantRepository.GetByIdAsync(request.BookingParticipantId);
        if (participant is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingParticipant.NotFoundCode,
                ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
        }

        var passport = await passportRepository.GetByIdAsync(request.PassportId);
        if (passport is null || passport.BookingParticipantId != request.BookingParticipantId)
        {
            return Error.Validation(
                ErrorConstants.VisaApplication.PassportInvalidCode,
                ErrorConstants.VisaApplication.PassportInvalidDescription.Resolve(lang));
        }

        var entity = VisaApplicationEntity.Create(
            request.BookingParticipantId,
            request.PassportId,
            request.DestinationCountry,
            performedBy: "system",
            request.MinReturnDate,
            request.VisaFileUrl);

        await visaApplicationRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateVisaApplicationCommand(
    Guid VisaApplicationId,
    string DestinationCountry,
    VisaStatus? Status,
    DateTimeOffset? MinReturnDate,
    string? RefusalReason,
    string? VisaFileUrl) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateVisaApplicationCommandValidator : AbstractValidator<UpdateVisaApplicationCommand>
{
    public UpdateVisaApplicationCommandValidator()
    {
        RuleFor(x => x.VisaApplicationId).NotEmpty();
        RuleFor(x => x.DestinationCountry).NotEmpty().MaximumLength(100);
    }
}

public sealed class UpdateVisaApplicationCommandHandler(
    IVisaApplicationRepository visaApplicationRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingRepository bookingRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateVisaApplicationCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateVisaApplicationCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var entity = await visaApplicationRepository.GetByIdAsync(request.VisaApplicationId);
        if (entity is null)
        {
            return Error.NotFound(
                ErrorConstants.VisaApplication.NotFoundCode,
                ErrorConstants.VisaApplication.NotFoundDescription.Resolve(lang));
        }

        if (request.Status == VisaStatus.Approved)
        {
            var participant = await bookingParticipantRepository.GetByIdAsync(entity.BookingParticipantId);
            if (participant is null)
            {
                return Error.NotFound(
                    ErrorConstants.BookingParticipant.NotFoundCode,
                    ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
            }

            var booking = await bookingRepository.GetByIdAsync(participant.BookingId);
            if (booking is null)
            {
                return Error.NotFound(
                    ErrorConstants.Booking.NotFoundCode,
                    ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
            }

            if (DateTimeOffset.UtcNow >= booking.TourInstance.StartDate)
            {
                return Error.Validation(
                    ErrorConstants.VisaApplication.ApprovalTooLateCode,
                    ErrorConstants.VisaApplication.ApprovalTooLateDescription.Resolve(lang));
            }
        }

        entity.Update(
            request.DestinationCountry,
            performedBy: "system",
            request.Status,
            request.MinReturnDate,
            request.RefusalReason,
            request.VisaFileUrl);

        visaApplicationRepository.Update(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record CreateVisaCommand(
    Guid VisaApplicationId,
    string? VisaNumber,
    string? Country,
    VisaStatus Status,
    VisaEntryType? EntryType,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class CreateVisaCommandValidator : AbstractValidator<CreateVisaCommand>
{
    public CreateVisaCommandValidator()
    {
        RuleFor(x => x.VisaApplicationId).NotEmpty();
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class CreateVisaCommandHandler(
    IVisaApplicationRepository visaApplicationRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingRepository bookingRepository,
    IVisaRepository visaRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CreateVisaCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateVisaCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var visaApplication = await visaApplicationRepository.GetByIdAsync(request.VisaApplicationId);
        if (visaApplication is null)
        {
            return Error.NotFound(
                ErrorConstants.VisaApplication.NotFoundCode,
                ErrorConstants.VisaApplication.NotFoundDescription.Resolve(lang));
        }

        var existing = await visaRepository.GetByVisaApplicationIdAsync(request.VisaApplicationId);
        if (existing is not null)
        {
            return Error.Conflict(
                ErrorConstants.Visa.ExistsCode,
                ErrorConstants.Visa.ExistsDescription.Resolve(lang));
        }

        if (request.Status == VisaStatus.Approved)
        {
            var participant = await bookingParticipantRepository.GetByIdAsync(visaApplication.BookingParticipantId);
            if (participant is null)
            {
                return Error.NotFound(
                    ErrorConstants.BookingParticipant.NotFoundCode,
                    ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
            }

            var booking = await bookingRepository.GetByIdAsync(participant.BookingId);
            if (booking is null)
            {
                return Error.NotFound(
                    ErrorConstants.Booking.NotFoundCode,
                    ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
            }

            var approvedAt = request.IssuedAt ?? DateTimeOffset.UtcNow;
            if (approvedAt >= booking.TourInstance.StartDate)
            {
                return Error.Validation(
                    ErrorConstants.Visa.ApprovalTooLateCode,
                    ErrorConstants.Visa.ApprovalTooLateDescription.Resolve(lang));
            }
        }

        var entity = VisaEntity.Create(
            request.VisaApplicationId,
            performedBy: "system",
            request.VisaNumber,
            request.Country,
            request.Status,
            request.EntryType,
            request.IssuedAt,
            request.ExpiresAt,
            request.FileUrl);

        await visaRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record GetBookingParticipantsQuery(Guid BookingId) : IQuery<ErrorOr<List<ParticipantDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:participants:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingParticipantsQueryHandler(
    IBookingParticipantRepository bookingParticipantRepository,
    IPassportRepository passportRepository,
    IVisaApplicationRepository visaApplicationRepository,
    IVisaRepository visaRepository,
    IBookingRepository bookingRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingParticipantsQuery, ErrorOr<List<ParticipantDto>>>
{
    public async Task<ErrorOr<List<ParticipantDto>>> Handle(GetBookingParticipantsQuery request, CancellationToken cancellationToken)
    {
        // Ownership validation - check if user can access this booking
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        if (!await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken))
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        var participants = await bookingParticipantRepository.GetByBookingIdAsync(request.BookingId);
        var result = new List<ParticipantDto>();

        foreach (var participant in participants)
        {
            var passport = await passportRepository.GetByBookingParticipantIdAsync(participant.Id);
            var visaApplications = await visaApplicationRepository.GetByBookingParticipantIdAsync(participant.Id);

            var visaApplicationDtos = new List<VisaApplicationDto>();
            foreach (var application in visaApplications)
            {
                var visa = await visaRepository.GetByVisaApplicationIdAsync(application.Id);
                visaApplicationDtos.Add(ToVisaApplicationDto(application, visa));
            }

            result.Add(new ParticipantDto(
                participant.Id,
                participant.BookingId,
                participant.ParticipantType,
                participant.FullName,
                participant.DateOfBirth,
                participant.Gender,
                participant.Nationality,
                participant.Status,
                passport is null ? null : ToPassportDto(passport),
                visaApplicationDtos));
        }

        return result;
    }

    private static PassportDto ToPassportDto(PassportEntity entity)
    {
        return new PassportDto(
            entity.Id,
            entity.BookingParticipantId,
            entity.PassportNumber,
            entity.Nationality,
            entity.IssuedAt,
            entity.ExpiresAt,
            entity.FileUrl);
    }

    private static VisaApplicationDto ToVisaApplicationDto(VisaApplicationEntity application, VisaEntity? visa)
    {
        return new VisaApplicationDto(
            application.Id,
            application.BookingParticipantId,
            application.PassportId,
            application.DestinationCountry,
            application.Status,
            application.MinReturnDate,
            application.RefusalReason,
            application.VisaFileUrl,
            visa is null
                ? null
                : new VisaDto(
                    visa.Id,
                    visa.VisaApplicationId,
                    visa.VisaNumber,
                    visa.Country,
                    visa.Status,
                    visa.EntryType,
                    visa.IssuedAt,
                    visa.ExpiresAt,
                    visa.FileUrl));
    }
}

public sealed record GetParticipantPassportQuery(Guid ParticipantId) : IQuery<ErrorOr<PassportDto>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:participant-passport:{ParticipantId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetParticipantPassportQueryHandler(
    IPassportRepository passportRepository,
    ILanguageContext? languageContext = null)
    : IQueryHandler<GetParticipantPassportQuery, ErrorOr<PassportDto>>
{
    public async Task<ErrorOr<PassportDto>> Handle(GetParticipantPassportQuery request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var passport = await passportRepository.GetByBookingParticipantIdAsync(request.ParticipantId);
        if (passport is null)
        {
            return Error.NotFound(
                ErrorConstants.Passport.NotFoundCode,
                ErrorConstants.Passport.NotFoundDescription.Resolve(lang));
        }

        return new PassportDto(
            passport.Id,
            passport.BookingParticipantId,
            passport.PassportNumber,
            passport.Nationality,
            passport.IssuedAt,
            passport.ExpiresAt,
            passport.FileUrl);
    }
}

public sealed record GetParticipantVisasQuery(Guid ParticipantId) : IQuery<ErrorOr<List<VisaApplicationDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:participant-visas:{ParticipantId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetParticipantVisasQueryHandler(
    IVisaApplicationRepository visaApplicationRepository,
    IVisaRepository visaRepository)
    : IQueryHandler<GetParticipantVisasQuery, ErrorOr<List<VisaApplicationDto>>>
{
    public async Task<ErrorOr<List<VisaApplicationDto>>> Handle(GetParticipantVisasQuery request, CancellationToken cancellationToken)
    {
        var applications = await visaApplicationRepository.GetByBookingParticipantIdAsync(request.ParticipantId);
        var result = new List<VisaApplicationDto>();

        foreach (var application in applications)
        {
            var visa = await visaRepository.GetByVisaApplicationIdAsync(application.Id);
            result.Add(new VisaApplicationDto(
                application.Id,
                application.BookingParticipantId,
                application.PassportId,
                application.DestinationCountry,
                application.Status,
                application.MinReturnDate,
                application.RefusalReason,
                application.VisaFileUrl,
                visa is null
                    ? null
                    : new VisaDto(
                        visa.Id,
                        visa.VisaApplicationId,
                        visa.VisaNumber,
                        visa.Country,
                        visa.Status,
                        visa.EntryType,
                        visa.IssuedAt,
                        visa.ExpiresAt,
                        visa.FileUrl)));
        }

        return result;
    }
}
