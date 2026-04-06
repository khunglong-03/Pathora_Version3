using FluentValidation;

namespace Application.Contracts.Identity;

public sealed record UserSettingVm(
    string PreferredLanguage,
    bool NotificationEmail,
    bool NotificationSms,
    bool NotificationPush,
    string Theme
);

public sealed record UpdateUserSettingsRequest(
    string? PreferredLanguage,
    bool? NotificationEmail,
    bool? NotificationSms,
    bool? NotificationPush,
    string? Theme
);

public sealed class UpdateUserSettingsRequestValidator : AbstractValidator<UpdateUserSettingsRequest>
{
    private static readonly string[] AllowedLanguages = ["vi", "en"];
    private static readonly string[] AllowedThemes = ["light", "dark"];

    public UpdateUserSettingsRequestValidator()
    {
        RuleFor(x => x.PreferredLanguage)
            .Must(lang => string.IsNullOrEmpty(lang) || AllowedLanguages.Contains(lang.ToLowerInvariant()))
            .WithMessage("PreferredLanguage must be 'vi' or 'en'.");

        RuleFor(x => x.Theme)
            .Must(theme => string.IsNullOrEmpty(theme) || AllowedThemes.Contains(theme.ToLowerInvariant()))
            .WithMessage("Theme must be 'light' or 'dark'.");
    }
}
