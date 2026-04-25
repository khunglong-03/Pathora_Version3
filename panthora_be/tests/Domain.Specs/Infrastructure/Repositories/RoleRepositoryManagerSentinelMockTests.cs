using global::Domain.Entities;
using global::Domain.Enums;
using global::Infrastructure.Data;
using global::Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace Domain.Specs.Infrastructure.Repositories;

public sealed class RoleRepositoryManagerSentinelMockTests
{
    private readonly AppDbContext _context;

    public RoleRepositoryManagerSentinelMockTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
    }

    #region AddUser — Manager role creates sentinel

    [Fact]
    public async Task AddUser_ManagerRole_CallsAddAsyncOnDbSet()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        var result = await repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var sentinel = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a =>
                a.TourManagerId == userId &&
                a.AssignedEntityType == AssignedEntityType.Tour &&
                a.AssignedUserId == null &&
                a.AssignedTourId == null);
        Assert.NotNull(sentinel);
    }

    [Fact]
    public async Task AddUser_ManagerRole_SetsCorrectSentinelFields()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        await repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();

        var sentinel = await _context.TourManagerAssignments
            .FirstAsync(a => a.TourManagerId == userId);

        Assert.Equal(userId, sentinel.TourManagerId);
        Assert.Equal(AssignedEntityType.Tour, sentinel.AssignedEntityType);
        Assert.Null(sentinel.AssignedUserId);
        Assert.Null(sentinel.AssignedTourId);
        Assert.Equal("system", sentinel.CreatedBy);
        Assert.NotEqual(Guid.Empty, sentinel.Id);
    }

    [Fact]
    public async Task AddUser_NonManagerRole_DoesNotCreateSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        await repository.AddUser(userId, new List<int> { 3 });

        var sentinel = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a => a.TourManagerId == userId);
        Assert.Null(sentinel);
    }

    [Fact]
    public async Task AddUser_MultipleRolesIncludingManager_CreatesSentinel()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        await repository.AddUser(userId, new List<int> { 1, 2, 3 });
        await _context.SaveChangesAsync();

        var sentinels = await _context.TourManagerAssignments
            .Where(a =>
                a.TourManagerId == userId &&
                a.AssignedEntityType == AssignedEntityType.Tour)
            .ToListAsync();
        Assert.Single(sentinels);
    }

    [Fact]
    public async Task AddUser_ManagerRoleAlreadyHasSentinel_NoDuplicate()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        await repository.AddUser(userId, new List<int> { 2 });
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        await repository.AddUser(userId, new List<int> { 4 });
        await _context.SaveChangesAsync();

        var sentinels = await _context.TourManagerAssignments
            .Where(a =>
                a.TourManagerId == userId &&
                a.AssignedEntityType == AssignedEntityType.Tour)
            .ToListAsync();
        Assert.Single(sentinels);
    }

    [Fact]
    public async Task AddUser_EmptyRoleList_ReturnsSuccess()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        var repository = new RoleRepository(_context);

        var result = await repository.AddUser(userId, new List<int>());

        Assert.False(result.IsError);
        var sentinel = await _context.TourManagerAssignments
            .FirstOrDefaultAsync(a => a.TourManagerId == userId);
        Assert.Null(sentinel);
    }

    #endregion

    #region DeleteUser — Manager role removes assignments

    [Fact]
    public async Task DeleteUser_HadManagerRole_RemovesAllAssignments()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        await SeedUser(managerId);
        await SeedUser(staffId);

        await _context.TourManagerAssignments.AddRangeAsync(new[]
        {
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.Tour, null, null, null, "system"),
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.TourDesigner, staffId, null, null, "system")
        });
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 2 });
        await _context.SaveChangesAsync();

        var repository = new RoleRepository(_context);

        var result = await repository.DeleteUser(managerId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var remaining = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task DeleteUser_HadOnlyNonManagerRole_PreservesAssignments()
    {
        var userId = Guid.NewGuid();
        await SeedUser(userId);

        await _context.TourManagerAssignments.AddAsync(
            TourManagerAssignmentEntity.Create(userId, AssignedEntityType.Tour, null, null, null, "system"));
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = userId, RoleId = 3 });
        await _context.SaveChangesAsync();

        var repository = new RoleRepository(_context);

        var result = await repository.DeleteUser(userId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var remaining = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == userId)
            .ToListAsync();
        Assert.Single(remaining);
    }

    [Fact]
    public async Task DeleteUser_HadManagerRole_NoAssignments_DoesNotThrow()
    {
        var managerId = Guid.NewGuid();
        await SeedUser(managerId);
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 2 });
        await _context.SaveChangesAsync();

        var repository = new RoleRepository(_context);

        var result = await repository.DeleteUser(managerId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
    }

    [Fact]
    public async Task DeleteUser_HadManagerRole_DeletesUserRoleRecords()
    {
        var managerId = Guid.NewGuid();
        await SeedUser(managerId);
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 2 });
        await _context.UserRoles.AddAsync(new UserRoleEntity { UserId = managerId, RoleId = 1 });
        await _context.SaveChangesAsync();

        var repository = new RoleRepository(_context);

        var result = await repository.DeleteUser(managerId);
        await _context.SaveChangesAsync();

        Assert.False(result.IsError);
        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == managerId)
            .ToListAsync();
        Assert.Empty(roles);
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

public sealed class TourManagerAssignmentRepositoryBulkUpsertSentinelMockTests
{
    private readonly AppDbContext _context;
    private readonly TourManagerAssignmentRepository _repository;

    public TourManagerAssignmentRepositoryBulkUpsertSentinelMockTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _repository = new TourManagerAssignmentRepository(_context);
    }

    #region BulkUpsertAsync — sentinel injection and preservation

    [Fact]
    public async Task BulkUpsertAsync_NewAssignments_NoExistingSentinel_InjectsSentinel()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        await SeedUsers(managerId, staffId);

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourDesigner, staffId, null, null, "system")
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
    }

    [Fact]
    public async Task BulkUpsertAsync_NewAssignments_SentinelAlreadyExists_PreservesSentinel()
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
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.TourDesigner, staffId1, null, null, "system"),
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.TourGuide, staffId2, null, null, "system")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();

        Assert.Equal(3, all.Count);
        Assert.Single(all, a =>
            a.AssignedUserId == null &&
            a.AssignedTourId == null &&
            a.AssignedEntityType == AssignedEntityType.Tour);
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
    public async Task BulkUpsertAsync_ExistingAssignmentsWithSentinel_ReplacesStaffOnly()
    {
        var managerId = Guid.NewGuid();
        var oldStaffId = Guid.NewGuid();
        var newStaffId = Guid.NewGuid();
        await SeedUsers(managerId, oldStaffId, newStaffId);

        var sentinel = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.Tour, null, null, null, "system");
        var oldAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, oldStaffId, null, null, "system");
        await _context.TourManagerAssignments.AddRangeAsync(new[] { sentinel, oldAssignment });
        await _context.SaveChangesAsync();

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(managerId, AssignedEntityType.TourGuide, newStaffId, null, null, "system")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "test", CancellationToken.None);

        var all = await _context.TourManagerAssignments
            .Where(a => a.TourManagerId == managerId)
            .ToListAsync();

        Assert.Equal(2, all.Count);
        Assert.Single(all, a => a.AssignedEntityType == AssignedEntityType.Tour);
        Assert.Single(all, a => a.AssignedEntityType == AssignedEntityType.TourGuide);
        Assert.DoesNotContain(all, a => a.AssignedEntityType == AssignedEntityType.TourDesigner);
    }

    [Fact]
    public async Task BulkUpsertAsync_NewAssignments_SentinelHasCorrectCreatedBy()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        await SeedUsers(managerId, staffId);

        var newAssignments = new List<TourManagerAssignmentEntity>
        {
            TourManagerAssignmentEntity.Create(
                managerId, AssignedEntityType.TourDesigner, staffId, null, null, "test-user")
        };

        await _repository.BulkUpsertAsync(managerId, newAssignments, "admin-override", CancellationToken.None);

        var sentinel = await _context.TourManagerAssignments
            .FirstAsync(a =>
                a.TourManagerId == managerId &&
                a.AssignedUserId == null &&
                a.AssignedTourId == null);

        Assert.Equal("admin-override", sentinel.CreatedBy);
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
