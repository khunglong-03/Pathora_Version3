using Domain.Common.Repositories;

namespace Domain.Entities;

public class OutboxMessage : Aggregate<Guid>
{
    public string Type { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public OutboxMessageStatus Status { get; private set; }
    public int RetryCount { get; private set; }
    public DateTimeOffset? NextRetryAt { get; private set; }
    public DateTimeOffset? ProcessedAt { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

    protected OutboxMessage() { }

    public static OutboxMessage Create(string type, string payload)
    {
        return new OutboxMessage
        {
            Id = Guid.CreateVersion7(),
            Type = type,
            Payload = payload,
            Status = OutboxMessageStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    public void MarkAsProcessing()
    {
        Status = OutboxMessageStatus.Processing;
    }

    public void MarkAsProcessed()
    {
        Status = OutboxMessageStatus.Processed;
        ProcessedAt = DateTimeOffset.UtcNow;
    }

    public void MarkAsFailed(string errorMessage, TimeSpan retryDelay)
    {
        Status = OutboxMessageStatus.Failed;
        RetryCount++;
        ErrorMessage = errorMessage;
        NextRetryAt = DateTimeOffset.UtcNow.Add(retryDelay);
    }

    public void MarkAsDeadLetter(string errorMessage)
    {
        Status = OutboxMessageStatus.DeadLettered;
        ErrorMessage = errorMessage;
        ProcessedAt = DateTimeOffset.UtcNow;
    }

    public bool CanRetry(int maxRetries) => RetryCount < maxRetries && Status == OutboxMessageStatus.Failed;
}

public enum OutboxMessageStatus
{
    Pending = 0,
    Processing = 1,
    Processed = 2,
    Failed = 3,
    DeadLettered = 4
}
