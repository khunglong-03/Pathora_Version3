namespace Domain.Entities;

using Domain.Abstractions;

public sealed class ManagerBankAccountEntity : Entity<Guid>
{
    public ManagerBankAccountEntity()
    {
        Id = Guid.CreateVersion7();
    }

    /// <summary>FK → Users.Id</summary>
    public Guid UserId { get; set; }

    /// <summary>Bank account number (digits only).</summary>
    public string BankAccountNumber { get; set; } = null!;

    /// <summary>Short bank code from VietQR, e.g. VCB, ACB, MB.</summary>
    public string BankCode { get; set; } = null!;

    /// <summary>6-digit BIN from VietQR, e.g. 970436.</summary>
    public string BankBin { get; set; } = null!;

    /// <summary>Human-readable bank short name, e.g. Vietcombank.</summary>
    public string? BankShortName { get; set; }

    /// <summary>Account holder name as registered with the bank.</summary>
    public string? BankAccountName { get; set; }

    /// <summary>Whether this is the default account used for receiving payments.</summary>
    public bool IsDefault { get; set; }

    /// <summary>Whether the account has been verified by an admin.</summary>
    public bool IsVerified { get; set; }

    /// <summary>When the account was verified.</summary>
    public DateTimeOffset? VerifiedAt { get; set; }

    /// <summary>Admin user who verified the account.</summary>
    public Guid? VerifiedBy { get; set; }

    // Navigation
    public UserEntity User { get; set; } = null!;
}
