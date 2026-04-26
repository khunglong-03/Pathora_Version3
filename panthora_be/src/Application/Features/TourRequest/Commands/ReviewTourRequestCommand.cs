using Application.Common.Constant;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Mails;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text.Json.Serialization;

namespace Application.Features.TourRequest.Commands;

public sealed record ReviewTourRequestCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("status")] TourRequestStatus Status,
    [property: JsonPropertyName("adminNote")] string? AdminNote = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourRequest];
}

public sealed class ReviewTourRequestCommandValidator : AbstractValidator<ReviewTourRequestCommand>
{
    public ReviewTourRequestCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourRequestIdRequired);

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.TourRequestReviewStatusRequired)
            .Must(status => status is TourRequestStatus.Approved or TourRequestStatus.Rejected)
            .WithMessage(ValidationMessages.TourRequestReviewStatusInvalid);

        RuleFor(x => x.AdminNote)
            .MaximumLength(2000).WithMessage(ValidationMessages.TourRequestAdminNoteMaxLength2000)
            .When(x => !string.IsNullOrWhiteSpace(x.AdminNote));
    }
}

public sealed class ReviewTourRequestCommandHandler(
    IUser user,
    IRoleRepository roleRepository,
    IUserRepository userRepository,
    ITourRequestRepository tourRequestRepository,
    IUnitOfWork unitOfWork,
    IMailRepository mailRepository,
    ILogger<ReviewTourRequestCommandHandler> logger)
    : ICommandHandler<ReviewTourRequestCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ReviewTourRequestCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var reviewerCheck = await EnsureReviewerAsync(currentUserId);
        if (reviewerCheck.IsError)
        {
            return reviewerCheck.Errors;
        }

        var requestEntity = await tourRequestRepository.GetByIdAsync(request.Id);
        if (requestEntity is null)
        {
            return Error.NotFound(ErrorConstants.TourRequest.NotFoundCode, ErrorConstants.TourRequest.NotFoundDescription);
        }

        var reviewerRole = user.Roles.FirstOrDefault() ?? "Admin";

        try
        {
            if (request.Status == TourRequestStatus.Approved)
            {
                requestEntity.Approve(currentUserId, currentUserId.ToString(), reviewerRole, adminNote: request.AdminNote);
            }
            else
            {
                requestEntity.Reject(currentUserId, currentUserId.ToString(), reviewerRole, request.AdminNote);
            }
        }
        catch (InvalidOperationException)
        {
            return Error.Validation(
                ErrorConstants.TourRequest.InvalidStatusTransitionCode,
                ErrorConstants.TourRequest.InvalidStatusTransitionDescription);
        }

        await tourRequestRepository.UpdateAsync(requestEntity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        // Only queue email for rejections — approvals trigger email when TourInstance is linked
        if (request.Status == TourRequestStatus.Rejected)
        {
            await TryQueueRejectionEmailAsync(requestEntity, request.AdminNote);
        }

        return Result.Success;
    }

    private async Task TryQueueRejectionEmailAsync(TourRequestEntity requestEntity, string? adminNote)
    {
        var recipientEmail = await ResolveRecipientEmailAsync(requestEntity);
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            logger.LogWarning(
                "Skipping tour request rejection notification for request {RequestId} because recipient email is missing.",
                requestEntity.Id);
            return;
        }

        var resolvedAdminNote = string.IsNullOrWhiteSpace(adminNote)
            ? "No additional note provided."
            : adminNote.Trim();

        try
        {
            var rejectedMail = new TourRequestRejectedMail(
                CustomerName: requestEntity.CustomerName,
                Destination: requestEntity.Destination,
                AdminNote: resolvedAdminNote,
                ResubmitLink: "/tours/custom");

            var mail = rejectedMail.ToMail(recipientEmail);
            mail.Subject = "Tour Request Update";

            var addResult = await mailRepository.Add(mail);
            if (addResult.IsError)
            {
                logger.LogWarning(
                    "Failed to queue tour request rejection notification for request {RequestId}: {ErrorDescription}",
                    requestEntity.Id,
                    addResult.FirstError.Description);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Failed to queue tour request rejection notification for request {RequestId}",
                requestEntity.Id);
        }
    }

    private async Task<string?> ResolveRecipientEmailAsync(TourRequestEntity requestEntity)
    {
        if (!string.IsNullOrWhiteSpace(requestEntity.CustomerEmail))
        {
            return requestEntity.CustomerEmail;
        }

        if (!requestEntity.UserId.HasValue)
        {
            return null;
        }

        var requestOwner = await userRepository.FindById(requestEntity.UserId.Value);
        return requestOwner?.Email;
    }

    private async Task<ErrorOr<Success>> EnsureReviewerAsync(Guid currentUserId)
    {
        var rolesResult = await roleRepository.FindByUserId(currentUserId.ToString());
        if (rolesResult.IsError)
        {
            return rolesResult.Errors;
        }

        var isReviewer = rolesResult.Value.Any(role =>
            string.Equals(role.Name, RoleConstants.Admin, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role.Name, RoleConstants.Manager, StringComparison.OrdinalIgnoreCase));

        return isReviewer
            ? Result.Success
            : Error.Forbidden(ErrorConstants.TourRequest.ReviewerOnlyCode, ErrorConstants.TourRequest.ReviewerOnlyDescription);
    }
}
