using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.Identity.Queries;

public sealed record GetUserSettingsQuery(string CurrentUserId)
    : IQuery<ErrorOr<UserSettingVm>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.User}:settings:{CurrentUserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetUserSettingsQueryHandler(
    IUser user,
    IUnitOfWork unitOfWork,
    ILogger<GetUserSettingsQueryHandler>? logger = null)
    : IQueryHandler<GetUserSettingsQuery, ErrorOr<UserSettingVm>>
{
    public async Task<ErrorOr<UserSettingVm>> Handle(
        GetUserSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        if (!Guid.TryParse(request.CurrentUserId, out var userId))
        {
            sw.Stop();
            logger?.LogWarning(
                "GetUserSettings: invalid userId {UserId}, duration={DurationMs}ms",
                request.CurrentUserId, sw.ElapsedMilliseconds);
            return Error.Unauthorized("User.Unauthorized", "Invalid user identifier.");
        }

        var repo = unitOfWork.GenericRepository<Domain.Entities.UserSettingEntity>();

        // UPSERT: try to get existing, if none, create with defaults
        var existing = (await repo.GetListAsync(s => s.UserId == userId)).FirstOrDefault();

        if (existing is null)
        {
            // Race condition fix: use UPSERT semantics — check again inside transaction
            await unitOfWork.ExecuteTransactionAsync(async () =>
            {
                var recheck = (await repo.GetListAsync(s => s.UserId == userId)).FirstOrDefault();
                if (recheck is null)
                {
                    var newSettings = Domain.Entities.UserSettingEntity.Create(userId, user.Id ?? "system");
                    await repo.AddAsync(newSettings);
                }
            });

            // Re-fetch after creation
            existing = (await repo.GetListAsync(s => s.UserId == userId)).FirstOrDefault();
        }

        sw.Stop();
        logger?.LogInformation(
            "GetUserSettings: userId={UserId}, found={Found}, duration={DurationMs}ms",
            userId, existing is not null, sw.ElapsedMilliseconds);

        if (existing is null)
        {
            // Fallback to defaults if something went wrong
            return new UserSettingVm(
                PreferredLanguage: "vi",
                NotificationEmail: true,
                NotificationSms: true,
                NotificationPush: false,
                Theme: "light");
        }

        return new UserSettingVm(
            PreferredLanguage: existing.PreferredLanguage,
            NotificationEmail: existing.NotificationEmail,
            NotificationSms: existing.NotificationSms,
            NotificationPush: existing.NotificationPush,
            Theme: existing.Theme);
    }
}
