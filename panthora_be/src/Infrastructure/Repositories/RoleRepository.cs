using Domain.Common.Repositories;
using Application.Common.Constant;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class RoleRepository(AppDbContext context) : IRoleRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> Create(RoleEntity role)
    {
        await _context.Roles.AddAsync(role);
        return Result.Success;
    }

    public Task<ErrorOr<Success>> Update(RoleEntity role)
    {
        _context.Roles.Update(role);
        return Task.FromResult<ErrorOr<Success>>(Result.Success);
    }

    public async Task<ErrorOr<Success>> AddUser(Guid userId, List<int> roleIds)
    {
        var userRoles = roleIds.Select(roleId => new UserRoleEntity
        {
            UserId = userId,
            RoleId = roleId
        }).ToList();
        await _context.UserRoles.AddRangeAsync(userRoles);

        if (roleIds.Contains(2))
        {
            await EnsureManagerSentinelAsync(userId);
        }

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> DeleteUser(Guid userId)
    {
        var hadManager = await _context.UserRoles
            .AnyAsync(ur => ur.UserId == userId && ur.RoleId == 2);

        var userRoles = await _context.UserRoles.Where(ur => ur.UserId == userId).ToListAsync();
        _context.UserRoles.RemoveRange(userRoles);

        if (hadManager)
        {
            var assignments = await _context.TourManagerAssignments
                .Where(a => a.TourManagerId == userId)
                .ToListAsync();
            _context.TourManagerAssignments.RemoveRange(assignments);
        }

        return Result.Success;
    }

    private async Task EnsureManagerSentinelAsync(Guid userId)
    {
        var alreadyExists = await _context.TourManagerAssignments
            .AnyAsync(a =>
                a.TourManagerId == userId &&
                a.AssignedUserId == null &&
                a.AssignedTourId == null &&
                a.AssignedEntityType == AssignedEntityType.Tour);
        if (alreadyExists) return;

        await _context.TourManagerAssignments.AddAsync(new TourManagerAssignmentEntity
        {
            Id = Guid.CreateVersion7(),
            TourManagerId = userId,
            AssignedEntityType = AssignedEntityType.Tour,
            AssignedUserId = null,
            AssignedTourId = null,
            CreatedBy = "system",
            CreatedOnUtc = DateTimeOffset.UtcNow
        });
    }

    public async Task<ErrorOr<List<(Guid UserId, int RoleId)>>> FindAllUserRoles()
    {
        var result = await _context.UserRoles
            .AsNoTracking()
            .Select(ur => new { ur.UserId, ur.RoleId })
            .ToListAsync();
        return result.Select(ur => (ur.UserId, ur.RoleId)).ToList();
    }

    public async Task<ErrorOr<List<RoleEntity>>> GetAll()
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(r => !r.IsDeleted)
            .ToListAsync();
    }

    public async Task<ErrorOr<RoleEntity?>> FindById(int roleId)
    {
        var role = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Id == roleId && !r.IsDeleted);
        return role;
    }

    public async Task<ErrorOr<RoleEntity?>> FindByNameAsync(string name)
    {
        var role = await _context.Roles.AsNoTracking().FirstOrDefaultAsync(r => r.Name == name && !r.IsDeleted);
        return role;
    }

    public async Task<ErrorOr<List<RoleEntity>>> FindByUserId(string userId)
    {
        if (!Guid.TryParse(userId, out var uid))
            return Error.Validation(ErrorConstants.User.InvalidIdCode, ErrorConstants.User.InvalidIdDescription);
        var roleIds = await _context.UserRoles
            .Where(ur => ur.UserId == uid)
            .Select(ur => ur.RoleId)
            .ToListAsync();
        var roles = await _context.Roles
            .AsNoTracking()
            .Where(r => roleIds.Contains(r.Id) && !r.IsDeleted)
            .ToListAsync();
        return roles;
    }

    public async Task<ErrorOr<Dictionary<Guid, List<RoleEntity>>>> FindByUserIds(List<Guid> userIds)
    {
        var userRoles = await _context.UserRoles
            .AsNoTracking()
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_context.Roles.Where(r => !r.IsDeleted),
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => new { ur.UserId, Role = r })
            .ToListAsync();

        return userRoles
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Role).ToList());
    }

    public async Task<ErrorOr<List<RoleEntity>>> FindAll(string? roleName = null, RoleStatus status = RoleStatus.Active, int pageNumber = 0, int pageSize = 0)
    {
        var query = _context.Roles.AsNoTracking().Where(r => !r.IsDeleted && r.Status == status);
        if (!string.IsNullOrWhiteSpace(roleName))
            query = query.Where(r => r.Name.ToLower().Contains(roleName.ToLower()));
        if (pageNumber > 0 && pageSize > 0)
            query = query.Skip((pageNumber - 1) * pageSize).Take(pageSize);
        return await query.OrderByDescending(r => r.CreatedOnUtc).ToListAsync();
    }

    public async Task<ErrorOr<int>> CountAll(string? roleName = null, RoleStatus status = RoleStatus.Active)
    {
        var query = _context.Roles.Where(r => !r.IsDeleted && r.Status == status);
        if (!string.IsNullOrWhiteSpace(roleName))
            query = query.Where(r => r.Name.ToLower().Contains(roleName.ToLower()));
        return await query.CountAsync();
    }
}
