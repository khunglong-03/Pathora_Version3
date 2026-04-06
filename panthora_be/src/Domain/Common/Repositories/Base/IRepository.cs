using System.Linq.Expressions;
namespace Domain.Common.Repositories;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<T>> GetListAsync(Expression<Func<T, bool>>? predicate = null, Expression<Func<T, object>>[]? includes = null);
    Task DeleteAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    void Update(T entity);
    Task UpdateRangeAsync(IEnumerable<T> entities);
    Task AddRangeAsync(IEnumerable<T> entities);
    void Delete(T entity);
    Task DeleteRangeAsync(IEnumerable<T> entities);
    Task<IQueryable<T>> GetQuery(Expression<Func<T, bool>> predicate);
    IQueryable<T> Get(
        Expression<Func<T, bool>>? filter = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        string includeProperties = "");
}
