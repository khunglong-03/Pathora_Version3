using Application.Contracts.Role;
using Application.Common.Constant;
using Contracts;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public sealed class RoleService(
    IRoleRepository roleRepository,
    IUser user,
    IUnitOfWork unitOfWork)
    : IRoleService
{
    public async Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> GetAllAsync(GetAllRoleRequest request)
    {
        var rolesResult = await roleRepository.FindAll(
            roleName: request.SearchText,
            status: RoleStatus.Active,
            pageNumber: request.PageNumber,
            pageSize: request.PageSize);

        if (rolesResult.IsError) return rolesResult.Errors;

        var countResult = await roleRepository.CountAll(request.SearchText, RoleStatus.Active);
        if (countResult.IsError) return countResult.Errors;
        var total = countResult.Value;

        var vms = rolesResult.Value
            .Select(r => new RoleVm(r.Id, r.Name, r.Description, (int)r.Status))
            .ToList();

        return new PaginatedListWithPermissions<RoleVm>(total, vms, new Dictionary<string, bool>());
    }

    public async Task<ErrorOr<RoleDetailResponse?>> GetByIdAsync(int roleId)
    {
        var roleResult = await roleRepository.FindById(roleId);
        if (roleResult.IsError) return roleResult.Errors;

        var role = roleResult.Value;
        if (role is null || role.IsDeleted)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        return new RoleDetailResponse(
            role.Id,
            role.Name,
            role.Description,
            (int)role.Status,
            role.IsDeleted,
            role.CreatedBy,
            role.CreatedOnUtc,
            role.LastModifiedBy,
            role.LastModifiedOnUtc);
    }

    public async Task<ErrorOr<int>> CreateAsync(CreateRoleRequest request)
    {
        var performedBy = user.Id ?? string.Empty;

        var existing = await roleRepository.FindByNameAsync(request.Name);
        if (!existing.IsError && existing.Value is not null)
            return Error.Conflict("Role.NameAlreadyExists", "Role name already exists");

        var role = RoleEntity.Create(request.Name, request.Description, performedBy);

        var createResult = await roleRepository.Create(role);
        if (createResult.IsError) return createResult.Errors;

        await unitOfWork.SaveChangeAsync();
        return role.Id;
    }

    public async Task<ErrorOr<Success>> UpdateAsync(UpdateRoleRequest request)
    {
        var roleResult = await roleRepository.FindById(request.RoleId);
        if (roleResult.IsError) return roleResult.Errors;
        if (roleResult.Value is null || roleResult.Value.IsDeleted)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        var role = roleResult.Value;

        var existing = await roleRepository.FindByNameAsync(request.Name);
        if (!existing.IsError && existing.Value is not null && existing.Value.Id != request.RoleId)
            return Error.Conflict("Role.NameAlreadyExists", "Role name already exists");

        role.Update(request.Name, request.Description, request.Status, user.Id ?? string.Empty);

        var updateResult = await roleRepository.Update(role);
        if (updateResult.IsError) return updateResult.Errors;

        await unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteAsync(int roleId)
    {
        var roleResult = await roleRepository.FindById(roleId);
        if (roleResult.IsError) return roleResult.Errors;
        if (roleResult.Value is null || roleResult.Value.IsDeleted)
            return Error.NotFound(ErrorConstants.Role.NotFoundCode, ErrorConstants.Role.NotFoundDescription);

        var role = roleResult.Value;
        role.SoftDelete(user.Id ?? string.Empty);

        var updateResult = await roleRepository.Update(role);
        if (updateResult.IsError) return updateResult.Errors;

        await unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}
