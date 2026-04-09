using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IPasswordResetTokenRepository
{
    Task<ErrorOr<Success>> CreateAsync(PasswordResetTokenEntity token, CancellationToken ct = default);
    Task<ErrorOr<PasswordResetTokenEntity?>> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default);
    Task<ErrorOr<PasswordResetTokenEntity?>> GetValidTokenAsync(string tokenHash, CancellationToken ct = default);
    Task<ErrorOr<Success>> MarkAsUsedAsync(Guid tokenId, CancellationToken ct = default);
    Task<ErrorOr<Success>> DeleteByUserIdAsync(string userId, CancellationToken ct = default);
}