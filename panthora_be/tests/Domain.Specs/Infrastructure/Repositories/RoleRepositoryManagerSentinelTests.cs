using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using ErrorOr;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class RoleRepositoryManagerSentinelTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly RoleRepository _repository;

    public RoleRepositoryManagerSentinelTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _repository = new RoleRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region AddUser sentinel creation

    [Fact]
    public async Task AddUser_WithManagerRole_CreatesSentinelAssignment()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var result = await _repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var assignment = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a => a.TourManagerId == userId);
        Assert.NotNull(assignment);
        Assert.Equal(AssignedEntityType.Tour, assignment.AssignedEntityType);
        Assert.Null(assignment.AssignedUserId);
        Assert.Null(assignment.AssignedTourId);
        Assert.Equal("system", assignment.CreatedBy);
    }

    [Fact]
    public async Task AddUser_WithNonManagerRole_DoesNotCreateSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var result = await _repository.AddUser(userId, new List<int> { 3 });
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var assignment = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a => a.TourManagerId == userId);
        Assert.Null(assignment);
    }

    [Fact]
    public async Task AddUser_WithMultipleRolesIncludingManager_CreatesSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var result = await _repository.AddUser(userId, new List<int> { 1, 2, 3 });
        await _context.SaveChangesAsync();
        Assert.False(result.IsError);
        var sentinel = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a =>
                a.TourManagerId == userId &&
                a.AssignedUserId == null &&
                a.AssignedTourId == null &&
                a.AssignedEntityType == AssignedEntityType.Tour);
        Assert.NotNull(sentinel);
    }

    [Fact]
    public async Task AddUser_ManagerRoleAlreadyHasSentinel_DoesNotDuplicate()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        await _repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();

        _context.ChangeTracker.Clear();

        await _repository.AddUser(userId, new List<int> { 4 });
        await _context.SaveChangesAsync();

        var sentinels = await _context.TourManagerAssignments
            .Where(a =>
                a.TourManagerId == userId &&
                a.AssignedUserId == null &&
                a.AssignedTourId == null &&
                a.AssignedEntityType == AssignedEntityType.Tour)
            .ToListAsync();
        Assert.Single(sentinels);
    }

    [Fact]
    public async Task AddUser_EmptyRoleList_DoesNotCreateSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var result = await _repository.AddUser(userId, new List<int>());

        Assert.False(result.IsError);
        var assignment = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a => a.TourManagerId == userId);
        Assert.Null(assignment);
    }

    [Fact]
    public async Task AddUser_ManagerRoleIdHardcoded_CreatesSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var result = await _repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var sentinels = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == userId)
            .ToListAsync();
        Assert.Single(sentinels);
        Assert.Equal(AssignedEntityType.Tour, sentinels[0].AssignedEntityType);
    }

    #endregion

    #region DeleteUser sentinel cleanup

    [Fact]
    public async Task DeleteUser_WithManagerRole_DeletesAllAssignments()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        await SeedUser(managerId);
        await SeedUser(staffId);

        await _context.TourManagerAssignments.AddRangeAsync(new[]
        {
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.Tour, null, null, null, "system"),
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.TourOperator, staffId, null, null, "system")
        });
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 2 });
        await _context.SaveChangesAsync();

        var result = await _repository.DeleteUser(managerId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var remaining = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task DeleteUser_WithNonManagerRole_DoesNotDeleteSentinel()
    {
        var managerId = Guid.NewGuid();
        await SeedUser(managerId);

        await _context.TourManagerAssignments.AddAsync(
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.Tour, null, null, null, "system"));
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 3 });
        await _context.SaveChangesAsync();

        var result = await _repository.DeleteUser(managerId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var remaining = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Single(remaining);
    }

    [Fact]
    public async Task DeleteUser_ManagerHasNoAssignments_DoesNotThrow()
    {
        var managerId = Guid.NewGuid();
        await SeedUser(managerId);
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 2 });
        await _context.SaveChangesAsync();

        var result = await _repository.DeleteUser(managerId);

        Assert.False(result.IsError);
    }

    #endregion

    private async Task SeedUser(Guid userId)
    {
        _context.Users.Add(new UserEntity
        {
            Id = userId,
            Username = $"user_{userId:N}",
            Email = $"{userId:N}@test.com",
            FullName = "Test User",
            IsDeleted = false,
            Status = UserStatus.Active
        });
        await _context.SaveChangesAsync();
    }
}

public sealed class TourManagerAssignmentRepositoryBulkUpsertSentinelTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly TourManagerAssignmentRepository _repository;

    public TourManagerAssignmentRepositoryBulkUpsertSentinelTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _repository = new TourManagerAssignmentRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    #region BulkUpsertAsync sentinel preservation

    [Fact]
    public async Task BulkUpsertAsync_NewAssignmentsInjectsSentinel_WhenNoSentinelExists()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        await SeedUsers(managerId, staffId);

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourOperator, staffId, null, null, "system")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Equal(2, all.Count);
        var sentinel = all.FirstOrDefault(a =>
            a.AssignedUserId == null &&
            a.AssignedTourId == null &&
            a.AssignedEntityType == AssignedEntityType.Tour);
        Assert.NotNull(sentinel);
        var staffAssignment = all.FirstOrDefault(a =>
            a.AssignedUserId == staffId &&
            a.AssignedEntityType == AssignedEntityType.TourOperator);
        Assert.NotNull(staffAssignment);
    }

    [Fact]
    public async Task BulkUpsertAsync_PreservesSentinel_WhenSentinelAlreadyExists()
    {
        var managerId = Guid.NewGuid();
        var staffId1 = Guid.NewGuid();
        var staffId2 = Guid.NewGuid();
        await SeedUsers(managerId, staffId1, staffId2);

        var sentinel = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.Tour, null, null, null, "system");
        await _context.TourManagerAssignments.AddAsync(sentinel);
        await _context.SaveChangesAsync();

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourOperator, staffId1, null, null, "system"),
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourGuide, staffId2, null, null, "system")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Equal(3, all.Count);
        var preservedSentinel = all.FirstOrDefault(a =>
            a.AssignedUserId == null &&
            a.AssignedTourId == null &&
            a.AssignedEntityType == AssignedEntityType.Tour);
        Assert.NotNull(preservedSentinel);
    }

    [Fact]
    public async Task BulkUpsertAsync_EmptyAssignments_DoesNotCreateSentinel()
    {
        var managerId = Guid.NewGuid();
        await SeedUsers(managerId);

        await _repository.BulkUpsertAsync(managerId, new List<TourManagerAssignmentEntity>(), "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Empty(all);
    }

    [Fact]
    public async Task BulkUpsertAsync_ReplacesAllAssignments_ButKeepsSentinel()
    {
        var managerId = Guid.NewGuid();
        var oldStaffId = Guid.NewGuid();
        var newStaffId = Guid.NewGuid();
        await SeedUsers(managerId, oldStaffId, newStaffId);

        var sentinel = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.Tour, null, null, null, "system");
        var oldAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourOperator, oldStaffId, null, null, "system");
        await _context.TourManagerAssignments.AddRangeAsync(new[] { sentinel, oldAssignment });
        await _context.SaveChangesAsync();

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourGuide, newStaffId, null, null, "system")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Equal(2, all.Count);
        Assert.Single(all, a => a.AssignedEntityType == AssignedEntityType.Tour);
        Assert.Single(all, a => a.AssignedEntityType == AssignedEntityType.TourGuide);
        Assert.DoesNotContain(all, a => a.AssignedEntityType == AssignedEntityType.TourOperator);
    }

    #endregion

    private async Task SeedUsers(params Guid[] userIds)
    {
        foreach (var id in userIds)
        {
            _context.Users.Add(new UserEntity
            {
                Id = id,
                Username = $"user_{id:N}",
                Email = $"{id:N}@test.com",
                FullName = "Test User",
                IsDeleted = false,
                Status = UserStatus.Active
            });
        }
        await _context.SaveChangesAsync();
    }
}
