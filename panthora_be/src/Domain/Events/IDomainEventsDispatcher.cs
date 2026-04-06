namespace Domain.Events;

public interface IDomainEventsDispatcher
{
    Task DispatchAsync(IReadOnlyList<IDomainEvent> events);
}