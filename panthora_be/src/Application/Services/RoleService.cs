using Contracts;
using Contracts.Interfaces;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Application.Contracts.Role;
using Domain.Constant;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Result = ErrorOr.Result;
using Domain.UnitOfWork;

namespace Application.Services;

public interface IRoleService
{
    Task<ErrorOr<int>> Create(CreateRoleRequest request);
    Task<ErrorOr<Success>> Update(UpdateRoleRequest request);
    Task<ErrorOr<Success>> Delete(DeleteRoleRequest request);
    Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> GetAll(GetAllRoleRequest request);
    Task<ErrorOr<List<LookupVm>>> GetAll();
    Task<ErrorOr<RoleDetailVm>> GetDetail(GetRoleDetailRequest request);
}

public class RoleService(IUser user, IUnitOfWork uow, IRoleRepository roleRepository) : IRoleService
{
    private readonly IUser _user = user;
    private readonly IUnitOfWork _uow = uow;
    private readonly IRoleRepository _roleRepository = roleRepository;

    public async Task<ErrorOr<int>> Create(CreateRoleRequest request)
    {
        var role = RoleEntity.Create(request.Name, request.Description, request.Type, _user.Id ?? string.Empty);

        var result = await _roleRepository.Create(role);
        if (result.IsError) return result.Errors;

        await _uow.SaveChangeAsync();
        return role.Id;
    }

    public async Task<ErrorOr<Success>> Update(UpdateRoleRequest request)
    {
        var roleResult = await _roleRepository.FindById(request.RoleId);
        if (roleResult.IsError) return roleResult.Errors;
        if (roleResult.Value is null)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        var role = roleResult.Value;
        role.Update(request.Name, request.Description, request.Type, request.Status, _user.Id ?? string.Empty);

        var result = await _roleRepository.Update(role);
        if (result.IsError) return result.Errors;

        await _uow.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(DeleteRoleRequest request)
    {
        var roleResult = await _roleRepository.FindById(request.RoleId);
        if (roleResult.IsError) return roleResult.Errors;
        if (roleResult.Value is null)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        var role = roleResult.Value;
        role.SoftDelete(_user.Id ?? string.Empty);
        var result = await _roleRepository.Update(role);
        if (result.IsError) return result.Errors;

        await _uow.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> GetAll(GetAllRoleRequest request)
    {
        var rolesResult = await _roleRepository.GetAll();
        if (rolesResult.IsError) return rolesResult.Errors;

        var roleVms = rolesResult.Value.Select(r => new RoleVm(
            r.Id, r.Name, r.Description, r.Type, r.Status, [])).ToList();

        return new PaginatedListWithPermissions<RoleVm>(roleVms.Count, roleVms, new Dictionary<string, bool>());
    }

    public async Task<ErrorOr<List<LookupVm>>> GetAll()
    {
        var rolesResult = await _roleRepository.GetAll();
        if (rolesResult.IsError) return rolesResult.Errors;

        return rolesResult.Value
            .Select(r => new LookupVm(r.Id.ToString(), r.Name))
            .ToList();
    }

    public async Task<ErrorOr<RoleDetailVm>> GetDetail(GetRoleDetailRequest request)
    {
        var roleResult = await _roleRepository.FindById(request.RoleId);
        if (roleResult.IsError) return roleResult.Errors;
        if (roleResult.Value is null)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        var role = roleResult.Value;
        return new RoleDetailVm(role.Id, role.Name, role.Description, role.Type, role.Status, []);
    }
}
