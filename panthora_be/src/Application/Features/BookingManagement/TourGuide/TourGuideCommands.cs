using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Services;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;

namespace Application.Features.BookingManagement.TourGuide;

public sealed record AssignTeamMemberCommand(
    Guid BookingId,
    Guid UserId,
    AssignedRole AssignedRole,
    bool IsLead,
    Guid? AssignedBy,
    string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class AssignTeamMemberCommandValidator : AbstractValidator<AssignTeamMemberCommand>
{
    public AssignTeamMemberCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class AssignTeamMemberCommandHandler(
    IBookingRepository bookingRepository,
    IUserRepository userRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<AssignTeamMemberCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(AssignTeamMemberCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        var user = await userRepository.FindById(request.UserId);
        if (user is null || user.IsDeleted)
        {
            return Error.NotFound(
                ErrorConstants.User.NotFoundCode,
                ErrorConstants.User.AssignedUserNotFoundDescription.Resolve(lang));
        }

        var existingAssignment = await bookingTourGuideRepository.GetByBookingIdAndUserIdAsync(request.BookingId, request.UserId);
        if (existingAssignment is not null)
        {
            return Error.Conflict(
                ErrorConstants.BookingTeam.AssignmentExistsCode,
                ErrorConstants.BookingTeam.AssignmentExistsDescription.Resolve(lang));
        }

        var entity = BookingTourGuideEntity.Create(
            request.BookingId,
            request.UserId,
            request.AssignedRole,
            performedBy: "system",
            request.IsLead,
            request.AssignedBy,
            request.Note);

        await bookingTourGuideRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}

public sealed record UpdateTeamMemberStatusCommand(
    Guid BookingId,
    Guid UserId,
    AssignmentStatus Status,
    string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateTeamMemberStatusCommandValidator : AbstractValidator<UpdateTeamMemberStatusCommand>
{
    public UpdateTeamMemberStatusCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class UpdateTeamMemberStatusCommandHandler(
    IBookingTourGuideRepository bookingTourGuideRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateTeamMemberStatusCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTeamMemberStatusCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var assignment = await bookingTourGuideRepository.GetByBookingIdAndUserIdAsync(request.BookingId, request.UserId);
        if (assignment is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTeam.AssignmentNotFoundCode,
                ErrorConstants.BookingTeam.AssignmentNotFoundDescription.Resolve(lang));
        }

        assignment.Update(
            assignment.AssignedRole,
            performedBy: "system",
            assignment.IsLead,
            request.Status,
            request.Note);

        bookingTourGuideRepository.Update(assignment);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetBookingTeamQuery(Guid BookingId) : IQuery<ErrorOr<List<BookingTeamMemberDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:team:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingTeamQueryHandler(
    IBookingRepository bookingRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingTeamQuery, ErrorOr<List<BookingTeamMemberDto>>>
{
    public async Task<ErrorOr<List<BookingTeamMemberDto>>> Handle(GetBookingTeamQuery request, CancellationToken cancellationToken)
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

        var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId);
        return assignments.Select(ToDto).ToList();
    }

    private static BookingTeamMemberDto ToDto(BookingTourGuideEntity entity)
    {
        return new BookingTeamMemberDto(
            entity.Id,
            entity.BookingId,
            entity.UserId,
            entity.AssignedRole,
            entity.IsLead,
            entity.Status,
            entity.AssignedDate,
            entity.Note);
    }
}

public sealed record GetBookingTourManagerQuery(Guid BookingId) : IQuery<ErrorOr<BookingTeamMemberDto>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:team-manager:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingTourManagerQueryHandler(
    IBookingRepository bookingRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    IOwnershipValidator ownershipValidator,
    ILanguageContext? languageContext = null)
    : IQueryHandler<GetBookingTourManagerQuery, ErrorOr<BookingTeamMemberDto>>
{
    public async Task<ErrorOr<BookingTeamMemberDto>> Handle(GetBookingTourManagerQuery request, CancellationToken cancellationToken)
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

        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId);
        var manager = assignments.FirstOrDefault(x => x.AssignedRole == AssignedRole.TourManager);
        if (manager is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTeam.TourManagerNotFoundCode,
                ErrorConstants.BookingTeam.TourManagerNotFoundDescription.Resolve(lang));
        }

        return new BookingTeamMemberDto(
            manager.Id,
            manager.BookingId,
            manager.UserId,
            manager.AssignedRole,
            manager.IsLead,
            manager.Status,
            manager.AssignedDate,
            manager.Note);
    }
}

public sealed record GetBookingTourOperatorsQuery(Guid BookingId) : IQuery<ErrorOr<List<BookingTeamMemberDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:team-operators:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingTourOperatorsQueryHandler(
    IBookingRepository bookingRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingTourOperatorsQuery, ErrorOr<List<BookingTeamMemberDto>>>
{
    public async Task<ErrorOr<List<BookingTeamMemberDto>>> Handle(GetBookingTourOperatorsQuery request, CancellationToken cancellationToken)
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

        var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId);
        return assignments
            .Where(x => x.AssignedRole == AssignedRole.TourDesigner)
            .Select(x => new BookingTeamMemberDto(
                x.Id,
                x.BookingId,
                x.UserId,
                x.AssignedRole,
                x.IsLead,
                x.Status,
                x.AssignedDate,
                x.Note))
            .ToList();
    }
}

public sealed record GetBookingAssignedTourGuidesQuery(Guid BookingId) : IQuery<ErrorOr<List<BookingTeamMemberDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:team-guides:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetBookingAssignedTourGuidesQueryHandler(
    IBookingRepository bookingRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    IOwnershipValidator ownershipValidator)
    : IQueryHandler<GetBookingAssignedTourGuidesQuery, ErrorOr<List<BookingTeamMemberDto>>>
{
    public async Task<ErrorOr<List<BookingTeamMemberDto>>> Handle(GetBookingAssignedTourGuidesQuery request, CancellationToken cancellationToken)
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

        var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId);
        return assignments
            .Where(x => x.AssignedRole == AssignedRole.TourGuide)
            .Select(x => new BookingTeamMemberDto(
                x.Id,
                x.BookingId,
                x.UserId,
                x.AssignedRole,
                x.IsLead,
                x.Status,
                x.AssignedDate,
                x.Note))
            .ToList();
    }
}

public sealed record UpdateTeamMemberAssignmentCommand(
    Guid BookingId,
    Guid UserId,
    AssignedRole AssignedRole,
    bool IsLead,
    string? Note) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class UpdateTeamMemberAssignmentCommandValidator : AbstractValidator<UpdateTeamMemberAssignmentCommand>
{
    public UpdateTeamMemberAssignmentCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
    }
}

public sealed class UpdateTeamMemberAssignmentCommandHandler(
    IBookingTourGuideRepository bookingTourGuideRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<UpdateTeamMemberAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateTeamMemberAssignmentCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var assignment = await bookingTourGuideRepository.GetByBookingIdAndUserIdAsync(request.BookingId, request.UserId);
        if (assignment is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTeam.AssignmentNotFoundCode,
                ErrorConstants.BookingTeam.AssignmentNotFoundDescription.Resolve(lang));
        }

        assignment.Update(
            request.AssignedRole,
            performedBy: "system",
            request.IsLead,
            assignment.Status,
            request.Note);

        bookingTourGuideRepository.Update(assignment);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record DeleteTeamMemberAssignmentCommand(Guid BookingId, Guid UserId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class DeleteTeamMemberAssignmentCommandHandler(
    IBookingTourGuideRepository bookingTourGuideRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<DeleteTeamMemberAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteTeamMemberAssignmentCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var assignment = await bookingTourGuideRepository.GetByBookingIdAndUserIdAsync(request.BookingId, request.UserId);
        if (assignment is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTeam.AssignmentNotFoundCode,
                ErrorConstants.BookingTeam.AssignmentNotFoundDescription.Resolve(lang));
        }

        bookingTourGuideRepository.Delete(assignment);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record ConfirmTeamMemberAssignmentCommand(Guid BookingId, Guid UserId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class ConfirmTeamMemberAssignmentCommandHandler(
    IBookingTourGuideRepository bookingTourGuideRepository,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<ConfirmTeamMemberAssignmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ConfirmTeamMemberAssignmentCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var assignment = await bookingTourGuideRepository.GetByBookingIdAndUserIdAsync(request.BookingId, request.UserId);
        if (assignment is null)
        {
            return Error.NotFound(
                ErrorConstants.BookingTeam.AssignmentNotFoundCode,
                ErrorConstants.BookingTeam.AssignmentNotFoundDescription.Resolve(lang));
        }

        assignment.Update(
            assignment.AssignedRole,
            performedBy: "system",
            assignment.IsLead,
            AssignmentStatus.Confirmed,
            assignment.Note);

        bookingTourGuideRepository.Update(assignment);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}
