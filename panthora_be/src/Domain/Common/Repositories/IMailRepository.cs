using Domain.Mails;
using Domain.Enums;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IMailRepository
{
    Task<ErrorOr<Success>> Add(MailEntity record, CancellationToken ct = default);
    Task AddWithoutSaveAsync(MailEntity record, CancellationToken ct = default);
    Task<ErrorOr<Success>> AddRange(List<MailEntity> records, CancellationToken ct = default);
    Task<ErrorOr<List<MailEntity>>> FindPending(CancellationToken ct = default);
    Task<ErrorOr<Success>> UpdateStatus(List<Guid> mailIds, MailStatus status, CancellationToken ct = default);
}