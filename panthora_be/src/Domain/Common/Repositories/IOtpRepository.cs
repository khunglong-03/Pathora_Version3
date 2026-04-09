using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IOtpRepository
{
    Task<ErrorOr<Success>> Upsert(OtpEntity otp, CancellationToken ct = default);
    Task<ErrorOr<OtpEntity?>> FindByEmail(string email, CancellationToken ct = default);

    // Failed registration attempt tracking
    Task<ErrorOr<int>> GetFailedAttemptsCount(string email, CancellationToken ct = default);
    Task<ErrorOr<Success>> IncrementFailedAttempts(string email, CancellationToken ct = default);
    Task<ErrorOr<DateTimeOffset?>> GetLockoutExpiration(string email, CancellationToken ct = default);
    Task<ErrorOr<Success>> SetLockout(string email, DateTimeOffset expiration, CancellationToken ct = default);
    Task<ErrorOr<Success>> ClearFailedAttempts(string email, CancellationToken ct = default);
}