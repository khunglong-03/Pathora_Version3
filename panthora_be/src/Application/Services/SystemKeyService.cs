using Domain.Common.Repositories;
using Domain.Constant;
using ErrorOr;

namespace Application.Services;

public interface ISystemKeyService
{
    Task<ErrorOr<List<SystemKey>>> GetAll();
}

public class SystemKeyService(ISystemKeyRepository systemKeyRepository) : ISystemKeyService
{

    public async Task<ErrorOr<List<SystemKey>>> GetAll()
    {
        var result = await systemKeyRepository.FindAll();
        if (result.IsError) return result.Errors;
        return result.Value;
    }
}

