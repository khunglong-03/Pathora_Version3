using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class OtpRepository(AppDbContext context) : IOtpRepository
{
    private readonly AppDbContext _context = context;
    private const int MaxFailedAttempts = 5;
    private const int LockoutMinutes = 30;

    public async Task<ErrorOr<Success>> Upsert(OtpEntity otp)
    {
        var existing = await _context.Set<OtpEntity>().FirstOrDefaultAsync(o => o.Email == otp.Email);
        if (existing is null)
        {
            await _context.Set<OtpEntity>().AddAsync(otp);
        }
        else
        {
            existing.Code = otp.Code;
            existing.ExpiryDate = otp.ExpiryDate;
            existing.IsDeleted = false;
        }
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<OtpEntity?>> FindByEmail(string email)
    {
        var otp = await _context.Set<OtpEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(o =>
                o.Email == email &&
                !o.IsDeleted &&
                o.ExpiryDate > DateTimeOffset.UtcNow);
        return otp;
    }

    public async Task<ErrorOr<int>> GetFailedAttemptsCount(string email)
    {
        var otp = await _context.Set<OtpEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Email == email);

        if (otp is null)
            return 0;

        // Check if lockout has expired
        if (otp.LockoutExpiration.HasValue && otp.LockoutExpiration.Value < DateTimeOffset.UtcNow)
        {
            // Clear expired lockout
            otp.FailedAttemptsCount = 0;
            otp.LockoutExpiration = null;
            await _context.SaveChangesAsync();
            return 0;
        }

        return otp.FailedAttemptsCount;
    }

    public async Task<ErrorOr<Success>> IncrementFailedAttempts(string email)
    {
        var otp = await _context.Set<OtpEntity>().FirstOrDefaultAsync(o => o.Email == email);

        if (otp is null)
        {
            // Create new record with 1 failed attempt
            otp = new OtpEntity
            {
                Email = email,
                Code = string.Empty,
                ExpiryDate = DateTimeOffset.UtcNow.AddDays(-1), // Expired
                FailedAttemptsCount = 1
            };
            await _context.Set<OtpEntity>().AddAsync(otp);
        }
        else
        {
            otp.FailedAttemptsCount++;

            // Set lockout if threshold exceeded
            if (otp.FailedAttemptsCount >= MaxFailedAttempts)
            {
                otp.LockoutExpiration = DateTimeOffset.UtcNow.AddMinutes(LockoutMinutes);
            }
        }

        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<DateTimeOffset?>> GetLockoutExpiration(string email)
    {
        var otp = await _context.Set<OtpEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Email == email);

        if (otp is null)
            return (DateTimeOffset?)null;

        // Check if lockout has expired
        if (otp.LockoutExpiration.HasValue && otp.LockoutExpiration.Value < DateTimeOffset.UtcNow)
        {
            // Clear expired lockout
            otp.FailedAttemptsCount = 0;
            otp.LockoutExpiration = null;
            await _context.SaveChangesAsync();
            return (DateTimeOffset?)null;
        }

        return otp.LockoutExpiration;
    }

    public async Task<ErrorOr<Success>> SetLockout(string email, DateTimeOffset expiration)
    {
        var otp = await _context.Set<OtpEntity>().FirstOrDefaultAsync(o => o.Email == email);

        if (otp is null)
        {
            otp = new OtpEntity
            {
                Email = email,
                Code = string.Empty,
                ExpiryDate = DateTimeOffset.UtcNow.AddDays(-1),
                FailedAttemptsCount = MaxFailedAttempts,
                LockoutExpiration = expiration
            };
            await _context.Set<OtpEntity>().AddAsync(otp);
        }
        else
        {
            otp.FailedAttemptsCount = MaxFailedAttempts;
            otp.LockoutExpiration = expiration;
        }

        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ClearFailedAttempts(string email)
    {
        var otp = await _context.Set<OtpEntity>().FirstOrDefaultAsync(o => o.Email == email);

        if (otp is not null)
        {
            otp.FailedAttemptsCount = 0;
            otp.LockoutExpiration = null;
            await _context.SaveChangesAsync();
        }

        return Result.Success;
    }
}
