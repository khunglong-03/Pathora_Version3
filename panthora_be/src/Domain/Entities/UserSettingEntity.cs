using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Cài đặt cá nhân của một User: ngôn ngữ ưa thích, kênh thông báo, và giao diện.
/// Mỗi User có tối đa một UserSetting.
/// </summary>
public class UserSettingEntity : Entity<Guid>
{
    public UserSettingEntity()
    {
        Id = Guid.CreateVersion7();
        PreferredLanguage = "vi";
        NotificationEmail = true;
        NotificationSms = true;
        NotificationPush = false;
        Theme = "light";
    }

    /// <summary>ID của user sở hữu cài đặt này.</summary>
    public Guid UserId { get; set; }
    /// <summary>Ngôn ngữ ưa thích (mã: "vi", "en").</summary>
    public string PreferredLanguage { get; set; }
    /// <summary>Bật thông báo qua email.</summary>
    public bool NotificationEmail { get; set; }
    /// <summary>Bật thông báo qua SMS.</summary>
    public bool NotificationSms { get; set; }
    /// <summary>Bật thông báo push.</summary>
    public bool NotificationPush { get; set; }
    /// <summary>Giao diện: "light" hoặc "dark".</summary>
    public string Theme { get; set; }

    /// <summary>User sở hữu cài đặt này.</summary>
    public UserEntity User { get; set; } = null!;

    public static UserSettingEntity Create(Guid userId, string performedBy)
    {
        return new UserSettingEntity
        {
            UserId = userId,
            PreferredLanguage = "vi",
            NotificationEmail = true,
            NotificationSms = true,
            NotificationPush = false,
            Theme = "light",
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
