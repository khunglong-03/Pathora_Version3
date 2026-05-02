using System.Data;
using Domain.Common.Repositories;
using ErrorOr;

namespace Domain.UnitOfWork;

public interface IUnitOfWork : IDisposable
{
    IRepository<TEntity> GenericRepository<TEntity>() where TEntity : class;
    int SaveChanges();
    Task<int> SaveChangeAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    Task ExecuteTransactionAsync(Func<Task> action);

    /// <summary>
    /// Executes the supplied work inside a DB transaction at the specified
    /// <paramref name="isolationLevel"/>. Use <see cref="IsolationLevel.RepeatableRead"/>
    /// (or higher) for inventory-hold approve flows to prevent cross-tour
    /// double-booking races (ER-1/ER-11).
    /// </summary>
    Task ExecuteTransactionAsync(IsolationLevel isolationLevel, Func<Task> action);
    void MarkAsAdded(object entity);
}
public static class UnitOfWorkExtensions
{
    public static async Task<ErrorOr<T>> Rollback<T>(
        this IUnitOfWork uow,
        List<Error> errors)
    {
        await uow.RollbackTransactionAsync();
        return errors;
    }
}
