using Application.Common.Interfaces;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;
using FluentValidation;

namespace Application.Features.VisaApplication.Commands;

// ─── Submit Visa Application ─────────────────────────────────────────────────

public sealed record SubmitCustomerVisaApplicationCommand(
    Guid BookingId,
    Guid BookingParticipantId,
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate = null,
    string? VisaFileUrl = null,
    string? VisaNumber = null,
    VisaEntryType? EntryType = null,
    DateTimeOffset? IssuedAt = null,
    DateTimeOffset? ExpiresAt = null,
    VisaCategory? Category = null,
    VisaFormat? Format = null,
    int? MaxStayDays = null,
    string? IssuingAuthority = null)
    : IRequest<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => ["Admin", "manager"];
}

public sealed class SubmitCustomerVisaApplicationCommandValidator : AbstractValidator<SubmitCustomerVisaApplicationCommand>
{
    public SubmitCustomerVisaApplicationCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.BookingParticipantId).NotEmpty();
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.DestinationCountry)
            .NotEmpty()
            .Length(2, 3)
            .Matches("^[A-Z]+$");
        RuleFor(x => x.MaxStayDays)
            .GreaterThan(0)
            .When(x => x.MaxStayDays.HasValue);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class SubmitCustomerVisaApplicationCommandHandler(
    IBookingRepository bookingRepository,
    IPassportRepository passportRepository,
    IVisaApplicationRepository visaApplicationRepository,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<SubmitCustomerVisaApplicationCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(
        SubmitCustomerVisaApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        if (booking.UserId == null || booking.UserId != currentUserId)
            return Error.Forbidden("Booking.Forbidden", "Bạn không có quyền truy cập booking này.");

        // Validate participant belongs to booking
        var participant = booking.BookingParticipants.FirstOrDefault(p => p.Id == request.BookingParticipantId);
        if (participant == null)
            return Error.NotFound("Participant.NotFound", "Participant không thuộc booking này.");

        // Mọi participant đều cần visa, không check tuổi nữa
        var tourInstance = booking.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        // Validate passport belongs to participant
        var passport = await passportRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
        if (passport == null || passport.Id != request.PassportId)
            return Error.NotFound("Passport.NotFound", "Passport không thuộc participant này.");

        // Chặn duplicate active application
        var existingApps = await visaApplicationRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
        var activeApp = existingApps.FirstOrDefault(v =>
            v.Status is VisaStatus.Pending or VisaStatus.Processing or VisaStatus.Approved);
        if (activeApp != null)
            return Error.Conflict("Visa.DuplicateActive", "Participant đã có đơn visa đang xử lý.");

        // Default minReturnDate về EndDate nếu không gửi
        var minReturnDate = (request.MinReturnDate ?? tourInstance.EndDate).ToUniversalTime();
        if (minReturnDate < tourInstance.EndDate)
            return Error.Validation("Visa.MinReturnDate", "MinReturnDate phải lớn hơn hoặc bằng ngày kết thúc tour.");

        var application = VisaApplicationEntity.Create(
            bookingParticipantId: request.BookingParticipantId,
            passportId: request.PassportId,
            destinationCountry: request.DestinationCountry,
            performedBy: currentUserId.Value.ToString(),
            minReturnDate: minReturnDate,
            visaFileUrl: request.VisaFileUrl);

        application.Update(
            destinationCountry: request.DestinationCountry,
            performedBy: currentUserId.Value.ToString(),
            status: VisaStatus.Processing);

        var visa = VisaEntity.Create(
            visaApplicationId: application.Id,
            performedBy: currentUserId.Value.ToString(),
            destinationCountry: request.DestinationCountry,
            visaNumber: request.VisaNumber,
            entryType: request.EntryType,
            issuedAt: request.IssuedAt?.ToUniversalTime(),
            expiresAt: request.ExpiresAt?.ToUniversalTime(),
            category: request.Category,
            format: request.Format,
            maxStayDays: request.MaxStayDays,
            issuingAuthority: request.IssuingAuthority,
            fileUrl: request.VisaFileUrl,
            status: VisaStatus.Pending);

        application.Visa = visa;

        await visaApplicationRepository.AddAsync(application, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return application.Id;
    }


}

// ─── Update Visa Application ─────────────────────────────────────────────────

public sealed record UpdateCustomerVisaApplicationCommand(
    Guid BookingId,
    Guid VisaApplicationId,
    Guid PassportId,
    string DestinationCountry,
    DateTimeOffset? MinReturnDate = null,
    string? VisaFileUrl = null,
    string? VisaNumber = null,
    VisaEntryType? EntryType = null,
    DateTimeOffset? IssuedAt = null,
    DateTimeOffset? ExpiresAt = null,
    VisaCategory? Category = null,
    VisaFormat? Format = null,
    int? MaxStayDays = null,
    string? IssuingAuthority = null)
    : IRequest<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => ["Admin", "manager"];
}

public sealed class UpdateCustomerVisaApplicationCommandValidator : AbstractValidator<UpdateCustomerVisaApplicationCommand>
{
    public UpdateCustomerVisaApplicationCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.VisaApplicationId).NotEmpty();
        RuleFor(x => x.PassportId).NotEmpty();
        RuleFor(x => x.DestinationCountry)
            .NotEmpty()
            .Length(2, 3)
            .Matches("^[A-Z]+$");
        RuleFor(x => x.MaxStayDays)
            .GreaterThan(0)
            .When(x => x.MaxStayDays.HasValue);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class UpdateCustomerVisaApplicationCommandHandler(
    IBookingRepository bookingRepository,
    IVisaApplicationRepository visaApplicationRepository,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCustomerVisaApplicationCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        UpdateCustomerVisaApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        if (booking.UserId == null || booking.UserId != currentUserId)
            return Error.Forbidden("Booking.Forbidden", "Bạn không có quyền truy cập booking này.");

        // Load visa application và validate ownership theo booking graph
        var application = await visaApplicationRepository.GetByIdWithVisaAsync(request.VisaApplicationId, cancellationToken);
        if (application == null)
            return Error.NotFound("Visa.NotFound", "Đơn visa không tồn tại.");

        // Validate application thuộc một participant trong booking này
        var participantIds = booking.BookingParticipants.Select(p => p.Id).ToHashSet();
        if (!participantIds.Contains(application.BookingParticipantId))
            return Error.Forbidden("Visa.Forbidden", "Đơn visa không thuộc booking này.");

        // Chỉ cho sửa khi Pending hoặc Rejected
        if (application.Status is not (VisaStatus.Pending or VisaStatus.Rejected))
            return Error.Conflict("Visa.CannotUpdate", "Chỉ có thể cập nhật đơn visa đang Pending hoặc đã Rejected.");

        var tourInstance = booking.TourInstance!;
        var minReturnDate = (request.MinReturnDate ?? tourInstance.EndDate).ToUniversalTime();

        // Nếu đơn đang Rejected → resubmit (clear reason, về Pending)
        if (application.Status == VisaStatus.Rejected)
        {
            application.Resubmit(currentUserId.Value.ToString(), request.VisaFileUrl);
        }

        // Khi khách hàng tự nộp visa (hoặc update khi đang Pending/vừa Resubmit),
        // chuyển trạng thái sang Processing để Manager review.
        var newStatus = application.Status == VisaStatus.Pending ? VisaStatus.Processing : (VisaStatus?)null;

        application.Update(
            destinationCountry: request.DestinationCountry,
            performedBy: currentUserId.Value.ToString(),
            status: newStatus,
            minReturnDate: minReturnDate,
            visaFileUrl: request.VisaFileUrl ?? application.VisaFileUrl);

        if (application.Visa != null)
        {
            application.Visa.Update(
                performedBy: currentUserId.Value.ToString(),
                visaNumber: request.VisaNumber ?? application.Visa.VisaNumber,
                entryType: request.EntryType ?? application.Visa.EntryType,
                issuedAt: request.IssuedAt?.ToUniversalTime() ?? application.Visa.IssuedAt,
                expiresAt: request.ExpiresAt?.ToUniversalTime() ?? application.Visa.ExpiresAt,
                destinationCountry: request.DestinationCountry,
                category: request.Category ?? application.Visa.Category,
                format: request.Format ?? application.Visa.Format,
                maxStayDays: request.MaxStayDays ?? application.Visa.MaxStayDays,
                issuingAuthority: request.IssuingAuthority ?? application.Visa.IssuingAuthority,
                status: newStatus,
                fileUrl: request.VisaFileUrl ?? application.Visa.FileUrl);
        }
        else
        {
            application.Visa = VisaEntity.Create(
                visaApplicationId: application.Id,
                performedBy: currentUserId.Value.ToString(),
                visaNumber: request.VisaNumber,
                entryType: request.EntryType,
                issuedAt: request.IssuedAt?.ToUniversalTime(),
                expiresAt: request.ExpiresAt?.ToUniversalTime(),
                destinationCountry: request.DestinationCountry,
                category: request.Category,
                format: request.Format,
                maxStayDays: request.MaxStayDays,
                issuingAuthority: request.IssuingAuthority,
                fileUrl: request.VisaFileUrl,
                status: newStatus ?? VisaStatus.Pending);
        }

        visaApplicationRepository.Update(application);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

// ─── Request Visa Support ─────────────────────────────────────────────────────

public sealed record RequestVisaSupportCommand(
    Guid BookingId,
    Guid BookingParticipantId)
    : IRequest<ErrorOr<Guid>>;

public sealed class RequestVisaSupportCommandValidator : AbstractValidator<RequestVisaSupportCommand>
{
    public RequestVisaSupportCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.BookingParticipantId).NotEmpty();
    }
}

public sealed class RequestVisaSupportCommandHandler(
    IBookingRepository bookingRepository,
    IPassportRepository passportRepository,
    IVisaApplicationRepository visaApplicationRepository,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<RequestVisaSupportCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(
        RequestVisaSupportCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking == null)
            return Error.NotFound("Booking.NotFound", "Booking không tồn tại.");

        if (booking.UserId == null || booking.UserId != currentUserId)
            return Error.Forbidden("Booking.Forbidden", "Bạn không có quyền truy cập booking này.");

        var participant = booking.BookingParticipants.FirstOrDefault(p => p.Id == request.BookingParticipantId);
        if (participant == null)
            return Error.NotFound("Participant.NotFound", "Participant không thuộc booking này.");

        var tourInstance = booking.TourInstance;
        if (tourInstance == null)
            return Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");

        // Mọi participant đều cần visa, không check tuổi nữa
        // Idempotent: nếu đã có active support request → trả về application hiện có
        var existingApps = await visaApplicationRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
        var existingSupport = existingApps.FirstOrDefault(v =>
            v.IsSystemAssisted &&
            v.Status is VisaStatus.Pending or VisaStatus.Processing);
        if (existingSupport != null)
            return existingSupport.Id;

        // Passport phải tồn tại để request support
        var passport = await passportRepository.GetByBookingParticipantIdAsync(participant.Id, cancellationToken);
        if (passport == null)
            return Error.Validation("Passport.Required", "Vui lòng thêm thông tin hộ chiếu trước khi yêu cầu hỗ trợ.");

        var application = VisaApplicationEntity.Create(
            bookingParticipantId: request.BookingParticipantId,
            passportId: passport.Id,
            destinationCountry: null,
            performedBy: currentUserId.Value.ToString(),
            minReturnDate: tourInstance.EndDate,
            isSystemAssisted: true);

        await visaApplicationRepository.AddAsync(application, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return application.Id;
    }

}

// ─── Update Customer Passport ──────────────────────────────────────────────────

public sealed record UpdateCustomerPassportCommand(
    Guid BookingId,
    Guid ParticipantId,
    string? PassportNumber,
    string? Nationality,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt,
    string? FileUrl)
    : IRequest<ErrorOr<Guid>>;

public sealed class UpdateCustomerPassportCommandValidator : AbstractValidator<UpdateCustomerPassportCommand>
{
    public UpdateCustomerPassportCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.ParticipantId).NotEmpty();
        RuleFor(x => x.PassportNumber)
            .NotEmpty()
            .When(x => string.IsNullOrEmpty(x.FileUrl))
            .WithMessage("Số hộ chiếu không được để trống khi chưa upload ảnh.");
        RuleFor(x => x.PassportNumber)
            .Must(x => x == null || !x.Equals("PENDING", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Số hộ chiếu không hợp lệ.")
            .MaximumLength(50)
            .Matches("^[A-Z0-9]+$")
            .When(x => !string.IsNullOrEmpty(x.PassportNumber));
        RuleFor(x => x.Nationality)
            .NotEmpty()
            .Length(2, 3);
        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.IssuedAt)
            .When(x => x.IssuedAt.HasValue && x.ExpiresAt.HasValue);
    }
}

public sealed class UpdateCustomerPassportCommandHandler(
    IBookingRepository bookingRepository,
    IPassportRepository passportRepository,
    ICurrentUser currentUser,
    Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCustomerPassportCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(
        UpdateCustomerPassportCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (currentUserId == null)
            return Error.Unauthorized("User.Unauthorized", "User is not authenticated.");

        ErrorOr<Guid> result = default;

        try
        {
            await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
            {
                var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
                if (booking == null)
                {
                    result = Error.NotFound("Booking.NotFound", "Booking không tồn tại.");
                    return;
                }

                if (booking.UserId == null || booking.UserId != currentUserId)
                {
                    result = Error.Forbidden("Booking.Forbidden", "Bạn không có quyền truy cập booking này.");
                    return;
                }

                var participant = booking.BookingParticipants.FirstOrDefault(p => p.Id == request.ParticipantId);
                if (participant == null)
                {
                    result = Error.NotFound("Participant.NotFound", "Participant không thuộc booking này.");
                    return;
                }

                var tourInstance = booking.TourInstance;
                if (tourInstance == null)
                {
                    result = Error.NotFound("TourInstance.NotFound", "TourInstance không tồn tại.");
                    return;
                }

                if (request.ExpiresAt.HasValue && request.ExpiresAt.Value < tourInstance.EndDate)
                {
                    result = Error.Validation("Passport.Expired", "Hộ chiếu phải còn hạn sau ngày kết thúc tour.");
                    return;
                }

                var existingPassport = await passportRepository.GetByBookingParticipantIdAsync(request.ParticipantId, cancellationToken);
                bool isPassportChanged = false;

                if (existingPassport != null)
                {
                    isPassportChanged = existingPassport.PassportNumber != request.PassportNumber
                        || existingPassport.Nationality != request.Nationality
                        || existingPassport.IssuedAt != request.IssuedAt?.ToUniversalTime()
                        || existingPassport.ExpiresAt != request.ExpiresAt?.ToUniversalTime()
                        || existingPassport.FileUrl != request.FileUrl;

                    if (isPassportChanged)
                    {
                        existingPassport.Update(
                            request.PassportNumber,
                            currentUserId.Value.ToString(),
                            request.Nationality,
                            request.IssuedAt?.ToUniversalTime(),
                            request.ExpiresAt?.ToUniversalTime(),
                            request.FileUrl
                        );
                        passportRepository.Update(existingPassport);
                    }
                    result = existingPassport.Id;
                }
                else
                {
                    isPassportChanged = true;
                    var newPassport = PassportEntity.Create(
                        bookingParticipantId: request.ParticipantId,
                        passportNumber: request.PassportNumber,
                        nationality: request.Nationality,
                        issuedAt: request.IssuedAt?.ToUniversalTime(),
                        expiresAt: request.ExpiresAt?.ToUniversalTime(),
                        fileUrl: request.FileUrl,
                        performedBy: currentUserId.Value.ToString()
                    );
                    await passportRepository.AddAsync(newPassport, cancellationToken);
                    result = newPassport.Id;
                }

                if (isPassportChanged)
                {
                    participant.ResetInfoReviewOnEdit(currentUserId.Value.ToString());
                }

                await unitOfWork.SaveChangeAsync(cancellationToken);
            });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            return Error.Conflict("Passport.ConcurrencyConflict", "Thông tin passport đã bị thay đổi bởi yêu cầu khác. Vui lòng tải lại.");
        }

        return result;
    }
}
