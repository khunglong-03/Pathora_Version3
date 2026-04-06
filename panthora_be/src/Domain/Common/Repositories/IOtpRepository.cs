using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IOtpRepository
{
    Task<ErrorOr<Success>> Upsert(OtpEntity otp);
    Task<ErrorOr<OtpEntity?>> FindByEmail(string email);

    // Failed registration attempt tracking
    Task<ErrorOr<int>> GetFailedAttemptsCount(string email);
    Task<ErrorOr<Success>> IncrementFailedAttempts(string email);
    Task<ErrorOr<DateTimeOffset?>> GetLockoutExpiration(string email);
    Task<ErrorOr<Success>> SetLockout(string email, DateTimeOffset expiration);
    Task<ErrorOr<Success>> ClearFailedAttempts(string email);
}
