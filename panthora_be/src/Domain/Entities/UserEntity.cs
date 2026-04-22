namespace Domain.Entities;

using Domain.Constant;

public class UserEntity : Aggregate<Guid>
{
    public UserEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public string Username { get; set; } = null!;
    public string? FullName { get; set; }
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public VerifyStatus VerifyStatus { get; set; } = VerifyStatus.Unverified;
    public string? Password { get; set; } = null!;
    public string? GoogleId { get; set; }
    public decimal Balance { get; set; } = 0m;
    public bool ForcePasswordChange { get; set; }
    public bool IsDeleted { get; set; } = false;

    public static UserEntity Create(string username, string? fullName, string email, string hashedPassword, string performedBy, string? avatar = null, bool forcePasswordChange = false)
    {
        return new UserEntity
        {
            Username = username,
            FullName = fullName,
            Email = email,
            AvatarUrl = avatar,
            Password = hashedPassword,
            Balance = 0m,
            ForcePasswordChange = forcePasswordChange,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string? fullName, string? avatar, string performedBy)
    {
        FullName = fullName;
        AvatarUrl = avatar;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void UpdateProfile(string? fullName, string? phoneNumber, string? address, string? avatar)
    {
        FullName = fullName;
        PhoneNumber = phoneNumber;
        Address = address;
        AvatarUrl = avatar;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void ChangePassword(string hashedPassword, string performedBy, bool forcePasswordChange = false)
    {
        Password = hashedPassword;
        ForcePasswordChange = forcePasswordChange;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void LinkGoogle(string googleId, string performedBy)
    {
        GoogleId = googleId;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public static UserEntity CreateFromGoogle(string googleId, string email, string? fullName, string? avatarUrl)
    {
        return new UserEntity
        {
            Username = email,
            FullName = fullName,
            Email = email,
            AvatarUrl = avatarUrl,
            GoogleId = googleId,
            Password = null,
            Balance = 0m,
            CreatedBy = AuthProviderConstants.Google,
            LastModifiedBy = AuthProviderConstants.Google,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public UserSettingEntity? UserSetting { get; set; }

    public void UpdateStatus(UserStatus status, string performedBy)
    {
        Status = status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
