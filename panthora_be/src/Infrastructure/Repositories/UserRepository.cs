using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class UserRepository(AppDbContext context) : Repository<UserEntity>(context), IUserRepository
{
    public async Task<UserEntity?> FindByEmail(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var result = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.Trim().ToLower() == normalizedEmail && !u.IsDeleted);
        return result;
    }

    public async Task<UserEntity?> FindById(Guid id)
    {
        return await _context.Users
            .AsNoTracking()
            .Include(u => u.UserSetting)
            .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);
    }

    public async Task<UserEntity?> FindByGoogleId(string googleId)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.GoogleId == googleId && !u.IsDeleted);
    }

    public async Task Create(UserEntity user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }



    public async Task SoftDelete(Guid id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user != null)
        {
            user.IsDeleted = true;
        }
    }

    public async Task<List<UserEntity>> FindAll(string? textSearch, Guid? departmentId, int pageNumber, int pageSize)
    {
        var query = _context.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<UserEntity>> FindAll(string? textSearch, Guid? departmentId, int pageNumber, int pageSize, List<Guid>? roleUserIds)
    {
        var query = _context.Users
            .AsNoTracking()
            .Where(u => !u.IsDeleted);

        if (roleUserIds is { Count: > 0 })
            query = query.Where(u => roleUserIds.Contains(u.Id));

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<UserEntity>> FindAll(string? textSearch, int? roleId, int pageNumber, int pageSize)
    {
        IQueryable<UserEntity> query;

        if (roleId.HasValue)
        {
            query = _context.UserRoles
                .AsNoTracking()
                .Where(ur => ur.RoleId == roleId.Value)
                .Join(_context.Users.Where(u => !u.IsDeleted),
                    ur => ur.UserId,
                    u => u.Id,
                    (ur, u) => u);
        }
        else
        {
            query = _context.Users
                .AsNoTracking()
                .Where(u => !u.IsDeleted);
        }

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountAll(string? textSearch, int? roleId)
    {
        IQueryable<UserEntity> query;

        if (roleId.HasValue)
        {
            query = _context.UserRoles
                .AsNoTracking()
                .Where(ur => ur.RoleId == roleId.Value)
                .Join(_context.Users.Where(u => !u.IsDeleted),
                    ur => ur.UserId,
                    u => u.Id,
                    (ur, u) => u);
        }
        else
        {
            query = _context.Users.Where(u => !u.IsDeleted);
        }

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query.CountAsync();
    }

    public async Task<int> CountAll(string? textSearch, Guid? departmentId)
    {
        var query = _context.Users.Where(u => !u.IsDeleted);

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query.CountAsync();
    }

    public async Task<int> CountActiveManagersAsync(CancellationToken cancellationToken)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == 2) // Manager role
            .Join(_context.Users.Where(u => !u.IsDeleted),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u)
            .CountAsync(cancellationToken);
    }

    public async Task<Dictionary<string, int>> CountByRolesAsync(string? textSearch, CancellationToken cancellationToken = default)
    {
        var userQuery = _context.UserRoles
            .AsNoTracking()
            .Join(_context.Users.Where(u => !u.IsDeleted),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => new { ur.RoleId, User = u });

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            userQuery = userQuery.Where(x =>
                (x.User.FullName != null && x.User.FullName.ToLower().Contains(search)) ||
                x.User.Email.ToLower().Contains(search) ||
                x.User.Username.ToLower().Contains(search));
        }

        var query = userQuery
            .Join(_context.Roles.Where(r => !r.IsDeleted),
                x => x.RoleId,
                r => r.Id,
                (x, r) => r.Name);

        var counts = await query
            .GroupBy(name => name)
            .Select(g => new { RoleName = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        return counts.ToDictionary(x => x.RoleName, x => x.Count);
    }

    public async Task<int> CountAll(string? textSearch, Guid? departmentId, List<Guid>? roleUserIds)
    {
        var query = _context.Users.Where(u => !u.IsDeleted);

        if (roleUserIds is { Count: > 0 })
            query = query.Where(u => roleUserIds.Contains(u.Id));

        if (!string.IsNullOrWhiteSpace(textSearch))
        {
            var search = textSearch.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        return await query.CountAsync();
    }

    public async Task<bool> IsEmailUnique(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return !await _context.Users.AnyAsync(u => u.Email != null && u.Email.Trim().ToLower() == normalizedEmail && !u.IsDeleted);
    }

    public async Task<List<UserEntity>> FindProvidersByRoleAsync(
        int roleId,
        string? search,
        string? status,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Join(_context.Users.Where(u => !u.IsDeleted),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.Username.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.Equals("Active", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Active);
        }
        else if (!string.IsNullOrWhiteSpace(status) && status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Inactive);
        }

        return await query
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountProvidersByRoleAsync(
        int roleId,
        string? search,
        string? status,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Join(_context.Users.Where(u => !u.IsDeleted),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.Username.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.Equals("Active", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Active);
        }
        else if (!string.IsNullOrWhiteSpace(status) && status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Inactive);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<List<ManagerUserSummaryDto>> GetAllManagerUsersAsync(CancellationToken cancellationToken)
    {
        // Query: Users → UserRoles (RoleId == 2) → LEFT JOIN TourManagerAssignments
        // Group by user, count by AssignedEntityType
        // Note: RoleId == 2 is "Manager" from seed data (role.json)
        // Note: TourManagerAssignmentEntity has no IsDeleted — query directly
        var query = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == 2) // Manager role
            .Join(
                _context.Users.Where(u => !u.IsDeleted),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u)
            .GroupJoin(
                _context.TourManagerAssignments,
                u => u.Id,
                tma => tma.TourManagerId,
                (u, assignments) => new { User = u, Assignments = assignments })
            .Select(g => new ManagerUserSummaryDto(
                g.User.Id,
                g.User.FullName ?? g.User.Username,
                g.User.Email,
                g.Assignments.Count(a => a.AssignedEntityType == AssignedEntityType.TourDesigner),
                g.Assignments.Count(a => a.AssignedEntityType == AssignedEntityType.TourGuide),
                g.Assignments.Count(a => a.AssignedEntityType == AssignedEntityType.Tour)));

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<List<UserEntity>> FindProvidersByRoleWithIdsAsync(
        int roleId,
        string? search,
        string? status,
        List<Guid> userIds,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Join(_context.Users.AsNoTracking().Where(u => !u.IsDeleted && userIds.Contains(u.Id)),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.Username.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.Equals("Active", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Active);
        }
        else if (!string.IsNullOrWhiteSpace(status) && status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Inactive);
        }

        return await query
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountProvidersByRoleWithIdsAsync(
        int roleId,
        string? search,
        string? status,
        List<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == roleId)
            .Join(_context.Users.AsNoTracking().Where(u => !u.IsDeleted && userIds.Contains(u.Id)),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(searchLower)) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.Username.ToLower().Contains(searchLower));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.Equals("Active", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Active);
        }
        else if (!string.IsNullOrWhiteSpace(status) && status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(u => u.Status == UserStatus.Inactive);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<UserEntity?> FindTransportProviderByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == (int)AssignedRole.TransportProvider)
            .Join(_context.Users
                .AsNoTracking()
                .Include(u => u.UserSetting)
                .Where(u => !u.IsDeleted && u.Id == id),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
