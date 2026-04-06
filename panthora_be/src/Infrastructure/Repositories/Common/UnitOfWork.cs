using Domain.Abstractions;
using Domain.Common.Repositories;
using Domain.Events;
using Domain.UnitOfWork;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MediatR;

namespace Infrastructure.Repositories.Common;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly IMediator _mediator;
    private readonly Dictionary<Type, object> _repositories = new();

    public UnitOfWork(AppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public AppDbContext ContextDb => _context;

    public async Task BeginTransactionAsync()
    {
        await ContextDb.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        await ContextDb.Database.CommitTransactionAsync();
        await DispatchDomainEventsAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }


    public async Task RollbackTransactionAsync()
    {
        if (ContextDb.Database.CurrentTransaction is null)
            return;
        await ContextDb.Database.RollbackTransactionAsync();
    }

    public async Task<int> SaveChangeAsync(CancellationToken cancellationToken = default)
    {
        var result = await ContextDb.SaveChangesAsync(cancellationToken);
        await DispatchDomainEventsAsync();
        return result;
    }

    public int SaveChanges()
    {
        var result = ContextDb.SaveChanges();
        DispatchDomainEventsAsync().GetAwaiter().GetResult();
        return result;
    }

    private async Task DispatchDomainEventsAsync()
    {
        var entities = ContextDb.ChangeTracker
            .Entries<IAggregate<Guid>>()
            .Select(x => x.Entity)
            .ToList();

        var events = entities
            .SelectMany(x => x.DomainEvents)
            .ToList();

        entities.ForEach(x => x.ClearDomainEvents());

        foreach (var domainEvent in events)
        {
            await _mediator.Publish(domainEvent);
        }
    }

    public IRepository<TEntity> GenericRepository<TEntity>() where TEntity : class
    {
        var type = typeof(TEntity);
        if (_repositories.TryGetValue(type, out var repository))
        {
            return (IRepository<TEntity>)repository;
        }

        var newRepository = new Repository<TEntity>(_context);
        _repositories[type] = newRepository;
        return newRepository;
    }

    public async Task ExecuteTransactionAsync(Func<Task> action)
    {
        var strategy = ContextDb.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await ContextDb.Database.BeginTransactionAsync();
            try
            {
                await action();

                await ContextDb.SaveChangesAsync();
                await transaction.CommitAsync();
                await DispatchDomainEventsAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }
}
