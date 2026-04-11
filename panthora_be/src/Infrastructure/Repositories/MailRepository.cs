using Domain.Common.Repositories;
using Domain.Mails;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class MailRepository(AppDbContext context) : IMailRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> Add(MailEntity record, CancellationToken ct = default)
    {
        await _context.Mails.AddAsync(record, ct);
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task AddWithoutSaveAsync(MailEntity record, CancellationToken ct = default)
    {
        await _context.Mails.AddAsync(record, ct);
        // No SaveChangesAsync — caller (e.g. ExecuteTransactionAsync) is responsible for saving
    }

    public async Task<ErrorOr<Success>> AddRange(List<MailEntity> records, CancellationToken ct = default)
    {
        await _context.Mails.AddRangeAsync(records, ct);
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<List<MailEntity>>> FindPending(CancellationToken ct = default)
    {
        return await _context.Mails
            .Where(m => m.Status == MailStatus.Pending)
            .ToListAsync(ct);
    }

    public async Task<ErrorOr<Success>> UpdateStatus(List<Guid> mailIds, MailStatus status, CancellationToken ct = default)
    {
        var mails = await _context.Mails.Where(m => mailIds.Contains(m.Id)).ToListAsync(ct);
        foreach (var mail in mails)
        {
            mail.Status = status;
            if (status == MailStatus.Sent)
                mail.SentAt = DateTimeOffset.UtcNow;
        }
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }
}