using Domain.Mails;
using Domain.Enums;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IMailRepository
{
    Task<ErrorOr<Success>> Add(MailEntity record);
    Task<ErrorOr<Success>> AddRange(List<MailEntity> records);
    Task<ErrorOr<List<MailEntity>>> FindPending();
    Task<ErrorOr<Success>> UpdateStatus(List<Guid> mailIds, MailStatus status);
}
