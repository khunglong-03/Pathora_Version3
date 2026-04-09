using Domain.Constant;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface ISystemKeyRepository
{
    Task<ErrorOr<List<SystemKey>>> FindAll(CancellationToken ct = default);
    Task<SystemKey?> FindByCode(string codeKey, CancellationToken cancellationToken = default);
}