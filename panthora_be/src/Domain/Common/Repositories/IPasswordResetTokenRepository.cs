using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IPasswordResetTokenRepository
{
    Task<ErrorOr<Success>> CreateAsync(PasswordResetTokenEntity token);
    Task<ErrorOr<PasswordResetTokenEntity?>> GetByTokenHashAsync(string tokenHash);
    Task<ErrorOr<PasswordResetTokenEntity?>> GetValidTokenAsync(string tokenHash);
    Task<ErrorOr<Success>> MarkAsUsedAsync(Guid tokenId);
    Task<ErrorOr<Success>> DeleteByUserIdAsync(string userId);
}
