using Contracts;
using Contracts.Interfaces;
using Domain.UnitOfWork;
using ErrorOr;
using Application.Contracts.Role;

namespace Application.Services;

public interface IRoleService
{
    Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> GetAllAsync(GetAllRoleRequest request);
    Task<ErrorOr<RoleDetailResponse?>> GetByIdAsync(int roleId);
    Task<ErrorOr<int>> CreateAsync(CreateRoleRequest request);
    Task<ErrorOr<Success>> UpdateAsync(UpdateRoleRequest request);
    Task<ErrorOr<Success>> DeleteAsync(int roleId);
}
