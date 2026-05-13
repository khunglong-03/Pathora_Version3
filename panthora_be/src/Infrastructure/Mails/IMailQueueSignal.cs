namespace Infrastructure.Mails;

public interface IMailQueueSignal
{
    bool HasPending { get; }

    ValueTask NotifyAsync(CancellationToken ct = default);

    Task WaitAsync(CancellationToken ct);

    void MarkDrained();

    Task StartSubscriberAsync(CancellationToken ct);
}
