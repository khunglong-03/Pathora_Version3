using Domain.Constant;
using System.Threading.Channels;

namespace Infrastructure.Loging;

public class LogQueue
{
    private readonly Channel<LogError> _queue = Channel.CreateUnbounded<LogError>();
    public ChannelWriter<LogError> Writer => _queue.Writer;
    public ChannelReader<LogError> Reader => _queue.Reader;
}
