namespace Domain.Entities;

using Domain.Abstractions;
using Domain.Enums;

public sealed class WithdrawalRequestEntity : Entity<Guid>
{
    public WithdrawalRequestEntity()
    {
        Id = Guid.CreateVersion7();
    }

    public Guid UserId { get; set; }
    public Guid BankAccountId { get; set; }
    public decimal Amount { get; set; }
    public WithdrawalStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public string? AdminNote { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? RejectedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }

    public string BankAccountNumber { get; set; } = null!;
    public string BankCode { get; set; } = null!;
    public string BankBin { get; set; } = null!;
    public string? BankShortName { get; set; }
    public string? BankAccountName { get; set; }

    public UserEntity User { get; set; } = null!;
    public ManagerBankAccountEntity BankAccount { get; set; } = null!;

    public static WithdrawalRequestEntity Create(
        Guid userId, 
        Guid bankAccountId, 
        decimal amount, 
        string bankAccountNumber, 
        string bankCode, 
        string bankBin, 
        string? bankShortName, 
        string? bankAccountName)
    {
        if (amount < 100_000m || amount > 10_000_000m)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be between 100,000 and 10,000,000.");

        return new WithdrawalRequestEntity
        {
            UserId = userId,
            BankAccountId = bankAccountId,
            Amount = amount,
            Status = WithdrawalStatus.Pending,
            BankAccountNumber = bankAccountNumber,
            BankCode = bankCode,
            BankBin = bankBin,
            BankShortName = bankShortName,
            BankAccountName = bankAccountName
        };
    }

    public void Approve(Guid adminId)
    {
        if (Status != WithdrawalStatus.Pending)
            throw new InvalidOperationException("Only pending requests can be approved.");

        Status = WithdrawalStatus.Approved;
        ApprovedAt = DateTimeOffset.UtcNow;
        ApprovedBy = adminId;
    }

    public void ConfirmTransfer()
    {
        if (Status != WithdrawalStatus.Approved)
            throw new InvalidOperationException("Only approved requests can be confirmed.");

        Status = WithdrawalStatus.Completed;
        CompletedAt = DateTimeOffset.UtcNow;
    }

    public void Reject(string reason)
    {
        if (Status != WithdrawalStatus.Pending)
            throw new InvalidOperationException("Only pending requests can be rejected.");
            
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Rejection reason is required.", nameof(reason));

        Status = WithdrawalStatus.Rejected;
        RejectionReason = reason.Trim();
        RejectedAt = DateTimeOffset.UtcNow;
    }

    public void Cancel()
    {
        if (Status != WithdrawalStatus.Pending)
            throw new InvalidOperationException("Only pending requests can be cancelled.");

        Status = WithdrawalStatus.Cancelled;
        CancelledAt = DateTimeOffset.UtcNow;
    }
}
