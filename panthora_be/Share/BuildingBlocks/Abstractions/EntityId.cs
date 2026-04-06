namespace Domain.Abstractions;

public abstract class EntityId<T> : IEntityId<T>
{
    public T Id { get; set; } = default!;
}
