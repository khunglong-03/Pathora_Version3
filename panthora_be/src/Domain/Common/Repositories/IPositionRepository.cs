using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface IPositionRepository
{
    Task<ErrorOr<Success>> Upsert(PositionEntity position);
    Task<ErrorOr<List<PositionEntity>>> FindAll();
    Task<ErrorOr<PositionEntity?>> FindById(Guid id);
}
