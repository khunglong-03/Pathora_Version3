using Domain.Abstractions;

namespace Domain.Entities;

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

    public Guid UserId { get; set; }
    public string PreferredLanguage { get; set; }
    public bool NotificationEmail { get; set; }
    public bool NotificationSms { get; set; }
    public bool NotificationPush { get; set; }
    public string Theme { get; set; }

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
