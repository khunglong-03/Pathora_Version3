using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace Application.Features.Identity.Commands;

public sealed record UpdateUserSettingsCommand(
    UpdateUserSettingsRequest Request,
    string CurrentUserId)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [$"{Common.CacheKey.User}:settings:{CurrentUserId}"];
}

public sealed class UpdateUserSettingsCommandValidator : AbstractValidator<UpdateUserSettingsCommand>
{
    private static readonly string[] AllowedLanguages = ["vi", "en"];
    private static readonly string[] AllowedThemes = ["light", "dark"];

    public UpdateUserSettingsCommandValidator()
    {
        RuleFor(x => x.Request.PreferredLanguage)
            .Must(lang => string.IsNullOrEmpty(lang) || AllowedLanguages.Contains(lang.ToLowerInvariant()))
            .WithMessage("PreferredLanguage must be 'vi' or 'en'.");

        RuleFor(x => x.Request.Theme)
            .Must(theme => string.IsNullOrEmpty(theme) || AllowedThemes.Contains(theme.ToLowerInvariant()))
            .WithMessage("Theme must be 'light' or 'dark'.");
    }
}

public sealed class UpdateUserSettingsCommandHandler(
    IUser user,
    IUnitOfWork unitOfWork,
    ILogger<UpdateUserSettingsCommandHandler>? logger = null)
    : ICommandHandler<UpdateUserSettingsCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        UpdateUserSettingsCommand request,
        CancellationToken cancellationToken)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        if (!Guid.TryParse(request.CurrentUserId, out var userId))
        {
            sw.Stop();
            logger?.LogWarning(
                "UpdateUserSettings: invalid userId {UserId}, duration={DurationMs}ms",
                request.CurrentUserId, sw.ElapsedMilliseconds);
            return Error.Unauthorized("User.Unauthorized", "Invalid user identifier.");
        }

        var repo = unitOfWork.GenericRepository<Domain.Entities.UserSettingEntity>();

        var existing = (await repo.GetListAsync(s => s.UserId == userId)).FirstOrDefault();

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            if (existing is null)
            {
                // Create with defaults first, then apply partial update
                existing = Domain.Entities.UserSettingEntity.Create(userId, user.Id ?? "system");
                await repo.AddAsync(existing);
            }

            // Partial update: only apply non-null fields
            if (request.Request.PreferredLanguage is not null)
                existing.PreferredLanguage = request.Request.PreferredLanguage.ToLowerInvariant();

            if (request.Request.NotificationEmail.HasValue)
                existing.NotificationEmail = request.Request.NotificationEmail.Value;

            if (request.Request.NotificationSms.HasValue)
                existing.NotificationSms = request.Request.NotificationSms.Value;

            if (request.Request.NotificationPush.HasValue)
                existing.NotificationPush = request.Request.NotificationPush.Value;

            if (request.Request.Theme is not null)
                existing.Theme = request.Request.Theme.ToLowerInvariant();

            repo.Update(existing);
        });

        sw.Stop();
        logger?.LogInformation(
            "UpdateUserSettings: userId={UserId}, duration={DurationMs}ms, success=true",
            userId, sw.ElapsedMilliseconds);

        return Result.Success;
    }
}
