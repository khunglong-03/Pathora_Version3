using Domain.Common.Repositories;

namespace Domain.Entities;

/// <summary>
/// Outbox pattern cho reliable event publishing. Mỗi message lưu type và payload,
/// được xử lý bất đồng bộ. Trạng thái: Pending → Processing → Processed/Failed/DeadLettered.
/// Retry tự động với cấu hình delay. Tránh mất event khi service crash.
/// </summary>
public class OutboxMessage : Aggregate<Guid>
{
    /// <summary>Tên type của message/command cần xử lý (assembly-qualified name).</summary>
    public string Type { get; private set; } = string.Empty;
    /// <summary>Payload JSON của message.</summary>
    public string Payload { get; private set; } = string.Empty;
    /// <summary>Trạng thái xử lý: Pending, Processing, Processed, Failed, DeadLettered.</summary>
    public OutboxMessageStatus Status { get; private set; }
    /// <summary>Số lần retry đã thực hiện.</summary>
    public int RetryCount { get; private set; }
    /// <summary>Thời gian dự kiến thực hiện retry tiếp theo.</summary>
    public DateTimeOffset? NextRetryAt { get; private set; }
    /// <summary>Thời gian xử lý thành công.</summary>
    public DateTimeOffset? ProcessedAt { get; private set; }
    /// <summary>Thông điệp lỗi nếu xử lý thất bại.</summary>
    public string? ErrorMessage { get; private set; }
    /// <summary>Thời gian tạo message.</summary>
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
