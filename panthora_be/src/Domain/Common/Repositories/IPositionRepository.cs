using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IPositionRepository
{
    Task<ErrorOr<Success>> Upsert(PositionEntity position, CancellationToken ct = default);
    Task<ErrorOr<List<PositionEntity>>> FindAll(CancellationToken ct = default);
    Task<ErrorOr<PositionEntity?>> FindById(Guid id, CancellationToken ct = default);
}