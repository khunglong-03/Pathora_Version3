using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PasswordResetTokenRepository(AppDbContext context) : IPasswordResetTokenRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> CreateAsync(PasswordResetTokenEntity token, CancellationToken ct = default)
    {
        // Delete any existing tokens for this user first
        var existingTokens = await _context.Set<PasswordResetTokenEntity>()
            .Where(t => t.UserId == token.UserId && !t.IsDeleted)
            .ToListAsync(ct);

        foreach (var existingToken in existingTokens)
        {
            existingToken.IsDeleted = true;
        }

        await _context.Set<PasswordResetTokenEntity>().AddAsync(token, ct);
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<PasswordResetTokenEntity?>> GetByTokenHashAsync(string tokenHash, CancellationToken ct = default)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                !t.IsDeleted, ct);
        return token;
    }

    public async Task<ErrorOr<PasswordResetTokenEntity?>> GetValidTokenAsync(string tokenHash, CancellationToken ct = default)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                !t.IsDeleted &&
                t.UsedAt == null &&
                t.ExpiresAt > DateTimeOffset.UtcNow, ct);
        return token;
    }

    public async Task<ErrorOr<Success>> MarkAsUsedAsync(Guid tokenId, CancellationToken ct = default)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .FirstOrDefaultAsync(t => t.Id == tokenId, ct);

        if (token is null)
        {
            return Error.NotFound("Token not found");
        }

        token.MarkAsUsed();
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteByUserIdAsync(string userId, CancellationToken ct = default)
    {
        var tokens = await _context.Set<PasswordResetTokenEntity>()
            .Where(t => t.UserId == userId && !t.IsDeleted)
            .ToListAsync(ct);

        foreach (var token in tokens)
        {
            token.IsDeleted = true;
        }

        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }
}