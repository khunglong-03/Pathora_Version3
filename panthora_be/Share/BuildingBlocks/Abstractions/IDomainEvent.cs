using MediatR;

namespace Domain.Abstractions;

public interface IDomainEvent : INotification
{
    Guid EventId => Guid.NewGuid();
    public DateTimeOffset OccurredOn => DateTimeOffset.UtcNow;
    public string EventType => GetType()?.AssemblyQualifiedName ?? string.Empty;

}
