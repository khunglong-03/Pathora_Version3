using Domain.Abstractions;

namespace Domain.Mails;

public class MailEntity : Aggregate<Guid>
{
    public string To { get; set; } = null!;
    public string Subject { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string Template { get; set; } = null!;
    public MailStatus Status { get; set; } = MailStatus.Pending;
    public DateTimeOffset? SentAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

