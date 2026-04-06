namespace Domain.Events;

using MediatR;

public sealed class DomainEventsDispatcher(IMediator mediator)
{
    public async Task DispatchAsync(IReadOnlyList<IDomainEvent> events)
    {
        foreach (var domainEvent in events)
        {
            await mediator.Publish(domainEvent);
        }
    }
}