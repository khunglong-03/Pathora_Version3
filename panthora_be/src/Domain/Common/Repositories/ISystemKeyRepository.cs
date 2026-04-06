using Domain.Constant;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface ISystemKeyRepository
{
    Task<ErrorOr<List<SystemKey>>> FindAll();
    Task<SystemKey?> FindByCode(string codeKey);
}
