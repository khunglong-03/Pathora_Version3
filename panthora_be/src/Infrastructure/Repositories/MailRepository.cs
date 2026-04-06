using Domain.Common.Repositories;
using Domain.Mails;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class MailRepository(AppDbContext context) : IMailRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> Add(MailEntity record)
    {
        await _context.Mails.AddAsync(record);
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> AddRange(List<MailEntity> records)
    {
        await _context.Mails.AddRangeAsync(records);
        await _context.SaveChangesAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<List<MailEntity>>> FindPending()
    {
        return await _context.Mails
            .Where(m => m.Status == MailStatus.Pending)
            .ToListAsync();
    }

    public async Task<ErrorOr<Success>> UpdateStatus(List<Guid> mailIds, MailStatus status)
    {
        var mails = await _context.Mails.Where(m => mailIds.Contains(m.Id)).ToListAsync();
        foreach (var mail in mails)
        {
            mail.Status = status;
            if (status == MailStatus.Sent)
                mail.SentAt = DateTimeOffset.UtcNow;
        }
        await _context.SaveChangesAsync();
        return Result.Success;
    }
}
