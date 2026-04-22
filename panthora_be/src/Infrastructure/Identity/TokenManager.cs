using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.Common;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ZiggyCreatures.Caching.Fusion;

namespace Infrastructure.Identity;

internal sealed class TokenManager(
    IOptions<JwtOptions> jwtOptions,
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IFusionCache fusionCache,
    IToken token,
    IUnitOfWork unitOfWork)
    : ITokenManager
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<ErrorOr<(string AccessToken, string RefreshToken)>> GenerateToken(UserEntity user, CancellationToken cancellationToken = default)
    {
        if (user.Status == UserStatus.Banned)
        {
            return Error.Forbidden("User.Banned", "Your account has been banned.");
        }

        var rolesResult = await roleRepository.FindByUserId(user.Id.ToString(), cancellationToken);
        if (rolesResult.IsError)
        {
            return rolesResult.Errors;
        }

        var tokenIssuer = ResolvePrimaryValue(_jwtOptions.Issuer);
        var tokenAudience = ResolvePrimaryValue(_jwtOptions.Audience);

        var roleClaims = rolesResult.Value
            .GroupBy(role => role.Id)
            .Select(group => group.First())
            .SelectMany(role => new[]
            {
                new Claim(ClaimTypes.Role, role.Name),
                new Claim("roles", role.Name)
            })
            .ToList();

        var key = Encoding.UTF8.GetBytes(_jwtOptions.Secret);
        var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Iss, tokenIssuer),
            new Claim(JwtRegisteredClaimNames.Aud, tokenAudience)
        };
        claims.AddRange(roleClaims);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpireInMinutes),
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.CreateToken(tokenDescriptor);
        var accessToken = tokenHandler.WriteToken(jwtToken);

        var refreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var refreshTokenEntity = new RefreshTokenEntity
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresOnUtc = DateTimeOffset.UtcNow.AddHours(_jwtOptions.RefreshTokenExpirationHours)
        };

        var repo = unitOfWork.GenericRepository<RefreshTokenEntity>();
        await repo.AddAsync(refreshTokenEntity);

        return (accessToken, refreshTokenValue);
    }

    public async Task<ErrorOr<(string AccessToken, string RefreshToken, List<RoleEntity> Roles)>> GenerateTokenWithRoles(UserEntity user, CancellationToken cancellationToken = default)
    {
        if (user.Status == UserStatus.Banned)
        {
            return Error.Forbidden("User.Banned", "Your account has been banned.");
        }

        var rolesResult = await roleRepository.FindByUserId(user.Id.ToString(), cancellationToken);
        if (rolesResult.IsError)
        {
            return rolesResult.Errors;
        }

        var tokenIssuer = ResolvePrimaryValue(_jwtOptions.Issuer);
        var tokenAudience = ResolvePrimaryValue(_jwtOptions.Audience);

        var roleClaims = rolesResult.Value
            .GroupBy(role => role.Id)
            .Select(group => group.First())
            .SelectMany(role => new[]
            {
                new Claim(ClaimTypes.Role, role.Name),
                new Claim("roles", role.Name)
            })
            .ToList();

        var key = Encoding.UTF8.GetBytes(_jwtOptions.Secret);
        var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Iss, tokenIssuer),
            new Claim(JwtRegisteredClaimNames.Aud, tokenAudience)
        };
        claims.AddRange(roleClaims);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpireInMinutes),
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.CreateToken(tokenDescriptor);
        var accessToken = tokenHandler.WriteToken(jwtToken);

        var refreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var refreshTokenEntity = new RefreshTokenEntity
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresOnUtc = DateTimeOffset.UtcNow.AddHours(_jwtOptions.RefreshTokenExpirationHours)
        };

        var repo = unitOfWork.GenericRepository<RefreshTokenEntity>();
        await repo.AddAsync(refreshTokenEntity);

        var deduplicatedRoles = rolesResult.Value
            .GroupBy(role => role.Id)
            .Select(group => group.First())
            .ToList();

        return (accessToken, refreshTokenValue, deduplicatedRoles);
    }

    public async Task<ErrorOr<(string AccessToken, string RefreshToken, Guid UserId)>> RefreshToken(string refreshToken)
    {
        var repo = unitOfWork.GenericRepository<RefreshTokenEntity>();
        var tokens = await repo.GetListAsync(t => t.Token == refreshToken);
        var tokenEntity = tokens.FirstOrDefault();

        if (tokenEntity is null)
            return Error.NotFound(ErrorConstants.RefreshToken.NotFoundCode, ErrorConstants.RefreshToken.NotFoundDescription);

        if (!tokenEntity.IsActive)
            return Error.Validation(ErrorConstants.RefreshToken.ExpiredCode, ErrorConstants.RefreshToken.ExpiredDescription);

        var user = await userRepository.FindById(tokenEntity.UserId);
        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        if (user.Status == UserStatus.Banned)
        {
            return Error.Forbidden("User.Banned", "Your account has been banned.");
        }

        // Delete old refresh token
        repo.Delete(tokenEntity);

        // Generate new token pair
        var generatedTokens = await GenerateToken(user);
        if (generatedTokens.IsError)
        {
            return generatedTokens.Errors;
        }

        return (generatedTokens.Value.AccessToken, generatedTokens.Value.RefreshToken, user.Id);
    }

    private static string ResolvePrimaryValue(string value)
    {
        return value
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))
            ?? value;
    }

    public async Task<ErrorOr<Success>> RevokeToken(string userId, string refreshToken)
    {
        // Blacklist the current access token
        var jti = token.Id;
        var exp = token.Expire;
        if (!string.IsNullOrEmpty(jti) && long.TryParse(exp, out var expEpoch))
        {
            var diff = expEpoch - DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (diff > 0)
            {
                await fusionCache.SetAsync($"{CacheKey.AccessToken}:blacklisted:{jti}", jti,
                    new FusionCacheEntryOptions
                    {
                        Duration = TimeSpan.FromSeconds(diff)
                    });
            }
        }

        // Delete the refresh token from DB
        var repo = unitOfWork.GenericRepository<RefreshTokenEntity>();
        var tokens = await repo.GetListAsync(t => t.Token == refreshToken);
        var tokenEntity = tokens.FirstOrDefault();
        if (tokenEntity is not null)
        {
            repo.Delete(tokenEntity);
        }

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> RevokeAllTokens(string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return Error.Validation("InvalidUserId", "Invalid user ID");

        var repo = unitOfWork.GenericRepository<RefreshTokenEntity>();
        var tokens = await repo.GetListAsync(t => t.UserId == uid && t.IsActive);
        foreach (var token in tokens)
        {
            repo.Delete(token);
        }

        return Result.Success;
    }
}
