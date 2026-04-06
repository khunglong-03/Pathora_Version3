using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PasswordResetTokenRepository(AppDbContext context) : IPasswordResetTokenRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> CreateAsync(PasswordResetTokenEntity token)
    {
        // Delete any existing tokens for this user first
        var existingTokens = await _context.Set<PasswordResetTokenEntity>()
            .Where(t => t.UserId == token.UserId && !t.IsDeleted)
            .ToListAsync();

        foreach (var existingToken in existingTokens)
        {
            existingToken.IsDeleted = true;
        }

        await _context.Set<PasswordResetTokenEntity>().AddAsync(token);
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<PasswordResetTokenEntity?>> GetByTokenHashAsync(string tokenHash)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                !t.IsDeleted);
        return token;
    }

    public async Task<ErrorOr<PasswordResetTokenEntity?>> GetValidTokenAsync(string tokenHash)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(t =>
                t.TokenHash == tokenHash &&
                !t.IsDeleted &&
                t.UsedAt == null &&
                t.ExpiresAt > DateTimeOffset.UtcNow);
        return token;
    }

    public async Task<ErrorOr<Success>> MarkAsUsedAsync(Guid tokenId)
    {
        var token = await _context.Set<PasswordResetTokenEntity>()
            .FirstOrDefaultAsync(t => t.Id == tokenId);

        if (token is null)
        {
            return Error.NotFound("Token not found");
        }

        token.MarkAsUsed();
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteByUserIdAsync(string userId)
    {
        var tokens = await _context.Set<PasswordResetTokenEntity>()
            .Where(t => t.UserId == userId && !t.IsDeleted)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsDeleted = true;
        }

        await _context.SaveChangesAsync();
        return Result.Success;
    }
}
