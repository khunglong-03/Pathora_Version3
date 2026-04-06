namespace Domain.Abstractions;

public interface IAggregate<T> : IAggregate, IEntityId<T>
{
}

public interface IAggregate : ICreationAuditable, IModificationAuditable
{
    IReadOnlyList<IDomainEvent> DomainEvents { get; }
    IDomainEvent[] ClearDomainEvents();

}
