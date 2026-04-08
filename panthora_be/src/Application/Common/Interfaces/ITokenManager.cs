using Domain.Entities;
using ErrorOr;

namespace Application.Common.Interfaces;

public interface ITokenManager
{
    Task<ErrorOr<(string AccessToken, string RefreshToken)>> GenerateToken(UserEntity user, CancellationToken cancellationToken = default);
    Task<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>> GenerateTokenWithRoles(UserEntity user, CancellationToken cancellationToken = default);
    Task<ErrorOr<(string AccessToken, string RefreshToken, Guid UserId)>> RefreshToken(string token);
    Task<ErrorOr<Success>> RevokeToken(string userId, string refreshToken);
    Task<ErrorOr<Success>> RevokeAllTokens(string userId);
}
