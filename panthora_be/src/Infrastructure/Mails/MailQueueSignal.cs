using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Infrastructure.Mails;

public sealed class MailQueueSignal : IMailQueueSignal, IAsyncDisposable
{
    private const string ChannelName = "pathora:mail:pending";

    private readonly SemaphoreSlim _gate = new(0, 1);
    private readonly IConnectionMultiplexer? _redis;
    private readonly ILogger<MailQueueSignal> _logger;
    private ChannelMessageQueue? _subscription;
    private int _hasPending;
    private int _subscriberStarted;

    public MailQueueSignal(ILogger<MailQueueSignal> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _redis = serviceProvider.GetService<IConnectionMultiplexer>();
    }

    public bool HasPending => Volatile.Read(ref _hasPending) == 1;

    public ValueTask NotifyAsync(CancellationToken ct = default)
    {
        RaiseLocal();

        if (_redis is { IsConnected: true })
        {
            try
            {
                var subscriber = _redis.GetSubscriber();
                return new ValueTask(subscriber.PublishAsync(RedisChannel.Literal(ChannelName), RedisValue.EmptyString));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to publish mail-pending signal to Redis.");
            }
        }

        return ValueTask.CompletedTask;
    }

    public Task WaitAsync(CancellationToken ct) => _gate.WaitAsync(ct);

    public void MarkDrained() => Interlocked.Exchange(ref _hasPending, 0);

    public async Task StartSubscriberAsync(CancellationToken ct)
    {
        if (Interlocked.Exchange(ref _subscriberStarted, 1) == 1) return;
        if (_redis is null || !_redis.IsConnected)
        {
            _logger.LogInformation("Mail queue signal running in local-only mode (no Redis subscriber).");
            return;
        }

        try
        {
            var subscriber = _redis.GetSubscriber();
            _subscription = await subscriber.SubscribeAsync(RedisChannel.Literal(ChannelName));
            _subscription.OnMessage(_ =>
            {
                try
                {
                    RaiseLocal();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to raise local mail-pending signal from Redis message.");
                }
            });
            _logger.LogInformation("Mail queue signal subscribed to Redis channel {Channel}.", ChannelName);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to subscribe mail-pending signal channel.");
        }
    }

    private void RaiseLocal()
    {
        Interlocked.Exchange(ref _hasPending, 1);
        if (_gate.CurrentCount == 0)
        {
            try
            {
                _gate.Release();
            }
            catch (SemaphoreFullException)
            {
            }
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_subscription is not null)
        {
            await _subscription.UnsubscribeAsync();
            _subscription = null;
        }
        _gate.Dispose();
    }
}
