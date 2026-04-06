using System.Globalization;
using Microsoft.Extensions.Logging;
using ErrorOr;
using FluentValidation;
using Application.Common;
using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Mails;
using Domain.UnitOfWork;

namespace Application.Features.TourRequest.Commands;

public sealed record CreateTourRequestCommand(
    string Destination,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    int NumberOfParticipants,
    decimal? BudgetPerPersonUsd,
    List<string>? TravelInterests,
    string? PreferredAccommodation = null,
    string? TransportationPreference = null,
    string? SpecialRequests = null) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourRequest];
}

public sealed class CreateTourRequestCommandValidator : AbstractValidator<CreateTourRequestCommand>
{
    private static readonly HashSet<string> AllowedTravelInterests =
    [
        "Adventure",
        "CultureAndHistory",
        "NatureAndWildlife",
        "FoodAndCulinary",
        "RelaxationAndWellness"
    ];

    public CreateTourRequestCommandValidator()
    {
        RuleFor(x => x.Destination)
            .NotEmpty().WithMessage(ValidationMessages.TourRequestDestinationRequired)
            .MaximumLength(500).WithMessage(ValidationMessages.TourRequestDestinationMaxLength500);

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage(ValidationMessages.TourRequestStartDateRequired);

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage(ValidationMessages.TourRequestEndDateAfterOrEqualStartDate)
            .When(x => x.EndDate.HasValue);

        RuleFor(x => x.NumberOfParticipants)
            .GreaterThan(0).WithMessage(ValidationMessages.TourRequestParticipantsGreaterThanZero);

        RuleFor(x => x.BudgetPerPersonUsd)
            .GreaterThan(0).WithMessage(ValidationMessages.TourRequestBudgetGreaterThanZero)
            .When(x => x.BudgetPerPersonUsd.HasValue);

        RuleForEach(x => x.TravelInterests)
            .Must(BeValidTravelInterest)
            .WithMessage(ValidationMessages.TourRequestTravelInterestInvalid)
            .When(x => x.TravelInterests is { Count: > 0 });

        RuleFor(x => x.PreferredAccommodation)
            .MaximumLength(500).WithMessage(ValidationMessages.TourRequestPreferredAccommodationMaxLength500)
            .When(x => !string.IsNullOrWhiteSpace(x.PreferredAccommodation));

        RuleFor(x => x.TransportationPreference)
            .MaximumLength(500).WithMessage(ValidationMessages.TourRequestTransportationPreferenceMaxLength500)
            .When(x => !string.IsNullOrWhiteSpace(x.TransportationPreference));

        RuleFor(x => x.SpecialRequests)
            .MaximumLength(2000).WithMessage(ValidationMessages.TourRequestSpecialRequestsMaxLength2000)
            .When(x => !string.IsNullOrWhiteSpace(x.SpecialRequests));
    }

    private static bool BeValidTravelInterest(string interest)
    {
        return !string.IsNullOrWhiteSpace(interest)
            && AllowedTravelInterests.Contains(interest.Trim());
    }
}

public sealed class CreateTourRequestCommandHandler(
    IUser user,
    IUserRepository userRepository,
    ITourRequestRepository tourRequestRepository,
    IUnitOfWork unitOfWork,
    IMailRepository mailRepository,
    ILogger<CreateTourRequestCommandHandler> logger)
    : ICommandHandler<CreateTourRequestCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateTourRequestCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var userId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var userEntity = await userRepository.FindById(userId);
        if (userEntity is null)
        {
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);
        }

        var requestEntity = TourRequestEntity.Create(
            customerName: string.IsNullOrWhiteSpace(userEntity.FullName) ? userEntity.Username : userEntity.FullName,
            customerPhone: userEntity.PhoneNumber ?? string.Empty,
            destination: request.Destination,
            departureDate: request.StartDate.ToUniversalTime(),
            numberAdult: request.NumberOfParticipants,
            performedBy: userEntity.Id.ToString(),
            userId: userEntity.Id,
            customerEmail: userEntity.Email,
            returnDate: request.EndDate?.ToUniversalTime(),
            budget: request.BudgetPerPersonUsd,
            travelInterests: request.TravelInterests ?? [],
            preferredAccommodation: request.PreferredAccommodation,
            transportationPreference: request.TransportationPreference,
            specialRequirements: request.SpecialRequests);

        await tourRequestRepository.AddAsync(requestEntity);
        await unitOfWork.SaveChangeAsync(cancellationToken);
        await TryQueueAdminNotificationAsync(requestEntity);

        return requestEntity.Id;
    }

    private async Task TryQueueAdminNotificationAsync(TourRequestEntity requestEntity)
    {
        var adminEmail = ResolveAdminNotificationEmail();
        if (string.IsNullOrWhiteSpace(adminEmail))
        {
            logger.LogWarning("Skipping tour request admin notification because ADMIN_NOTIFICATION_EMAIL is not configured.");
            return;
        }

        try
        {
            var mailModel = new TourRequestSubmittedMail(
                CustomerName: requestEntity.CustomerName,
                Destination: requestEntity.Destination,
                StartDate: requestEntity.DepartureDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                EndDate: requestEntity.ReturnDate?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "Flexible",
                NumberOfParticipants: requestEntity.NumberAdult,
                BudgetPerPersonUsd: requestEntity.Budget?.ToString("0.##", CultureInfo.InvariantCulture) ?? "Not specified",
                DashboardLink: ResolveDashboardLink());

            var mail = mailModel.ToMail(adminEmail);
            mail.Subject = $"New Tour Request: {requestEntity.Destination}";

            var addResult = await mailRepository.Add(mail);
            if (addResult.IsError)
            {
                logger.LogWarning(
                    "Failed to queue admin tour request notification for request {RequestId}: {ErrorDescription}",
                    requestEntity.Id,
                    addResult.FirstError.Description);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Failed to queue admin tour request notification for request {RequestId}",
                requestEntity.Id);
        }
    }

    private string? ResolveAdminNotificationEmail()
    {
        var configuredEmail = Environment.GetEnvironmentVariable("ADMIN_NOTIFICATION_EMAIL")
            ?? Environment.GetEnvironmentVariable("MAIL_ADMIN_NOTIFICATION_EMAIL");

        return string.IsNullOrWhiteSpace(configuredEmail)
            ? null
            : configuredEmail.Trim();
    }

    private string ResolveDashboardLink()
    {
        var frontendBaseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL");

        return string.IsNullOrWhiteSpace(frontendBaseUrl)
            ? "/dashboard/tour-requests"
            : $"{frontendBaseUrl.TrimEnd('/')}/dashboard/tour-requests";
    }
}
