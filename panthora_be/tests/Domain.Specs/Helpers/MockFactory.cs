using NSubstitute;
using Domain.UnitOfWork;
using Domain.Common.Repositories;

namespace Domain.Specs.Helpers;

/// <summary>
/// Factory for creating common mock objects used in tests
/// </summary>
public static class MockFactory
{
    /// <summary>
    /// Creates a mock IUnitOfWork with no-op SaveChangeAsync
    /// </summary>
    public static IUnitOfWork CreateUnitOfWork()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        unitOfWork.SaveChangeAsync(default).ReturnsForAnyArgs(1);
        return unitOfWork;
    }

    /// <summary>
    /// Creates a mock repository that returns the provided items
    /// </summary>
    public static IRepository<T> CreateRepository<T>(IList<T>? items = null) where T : class
    {
        var repository = Substitute.For<IRepository<T>>();
        var itemList = items?.ToList() ?? new List<T>();

        repository.GetAllAsync().Returns(itemList);
        repository.GetListAsync(Arg.Any<System.Linq.Expressions.Expression<Func<T, bool>>>())
            .Returns(call =>
            {
                var filter = call.Args()[0] as System.Linq.Expressions.Expression<Func<T, bool>>;
                if (filter == null) return itemList;
                return itemList.AsQueryable().Where(filter).ToList();
            });
        repository.GetListAsync().Returns(itemList);

        return repository;
    }

    /// <summary>
    /// Creates a mock repository that returns an entity by ID
    /// </summary>
    public static IRepository<T> CreateRepositoryWithId<T>(T? entity) where T : class
    {
        var repository = Substitute.For<IRepository<T>>();
        var itemList = entity != null ? new List<T> { entity } : new List<T>();

        repository.GetByIdAsync(Arg.Any<Guid>()).Returns(call =>
        {
            var id = call.Args()[0] as Guid?;
            return itemList.FirstOrDefault();
        });
        repository.GetAllAsync().Returns(itemList);

        return repository;
    }
}
