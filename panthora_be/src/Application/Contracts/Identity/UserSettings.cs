using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record UserSettingVm(
    [property: JsonPropertyName("preferredLanguage")] string PreferredLanguage,
    [property: JsonPropertyName("notificationEmail")] bool NotificationEmail,
    [property: JsonPropertyName("notificationSms")] bool NotificationSms,
    [property: JsonPropertyName("notificationPush")] bool NotificationPush,
    [property: JsonPropertyName("theme")] string Theme
);

public sealed record UpdateUserSettingsRequest(
    [property: JsonPropertyName("preferredLanguage")] string? PreferredLanguage,
    [property: JsonPropertyName("notificationEmail")] bool? NotificationEmail,
    [property: JsonPropertyName("notificationSms")] bool? NotificationSms,
    [property: JsonPropertyName("notificationPush")] bool? NotificationPush,
    [property: JsonPropertyName("theme")] string? Theme
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
