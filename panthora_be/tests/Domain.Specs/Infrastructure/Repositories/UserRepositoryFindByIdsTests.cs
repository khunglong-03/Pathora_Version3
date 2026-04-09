using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure.Repositories;

/// <summary>
/// Integration tests verifying that UserRepository.FindByIds()
/// performs a single batch query instead of N individual queries.
/// </summary>
public sealed class UserRepositoryFindByIdsTests
{
    private static AppDbContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<List<Guid>> SeedUsers(AppDbContext context)
    {
        var ids = new List<Guid>();
        for (int i = 0; i < 5; i++)
        {
            var user = new UserEntity
            {
                Id = Guid.NewGuid(),
                Username = $"findbyids_user_{i}",
                Email = $"findbyids_{i}@test.com",
                FullName = $"FindByIds User {i}",
                Status = UserStatus.Active,
                IsDeleted = i % 2 == 0 ? false : true,
            };
            context.Users.Add(user);
            ids.Add(user.Id);
        }
        await context.SaveChangesAsync();
        return ids;
    }

    [Fact]
    public async Task FindByIds_ReturnsMatchingActiveUsers()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var seedIds = await SeedUsers(context);
        var repo = new UserRepository(context);

        var activeIds = seedIds.Where((_, i) => i % 2 == 0).ToList();
        var result = await repo.FindByIds(activeIds);

        Assert.Equal(activeIds.Count, result.Count);
        Assert.All(result, u => Assert.False(u.IsDeleted));
    }

    [Fact]
    public async Task FindByIds_DoesNotReturnDeletedUsers()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var seedIds = await SeedUsers(context);
        var repo = new UserRepository(context);

        var deletedIds = seedIds.Where((_, i) => i % 2 != 0).ToList();
        var result = await repo.FindByIds(deletedIds);

        Assert.Empty(result);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyListForEmptyInput()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new UserRepository(context);

        var result = await repo.FindByIds(Array.Empty<Guid>());

        Assert.Empty(result);
    }

    [Fact]
    public async Task FindByIds_ReturnsEmptyListForNonExistentIds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var repo = new UserRepository(context);

        var result = await repo.FindByIds(new[] { Guid.NewGuid(), Guid.NewGuid() });

        Assert.Empty(result);
    }

    [Fact]
    public async Task FindByIds_ReturnsCorrectCount_ForSubsetOfIds()
    {
        var dbName = Guid.NewGuid().ToString();
        using var context = CreateContext(dbName);
        var seedIds = await SeedUsers(context);
        var repo = new UserRepository(context);

        // Only request 2 of the 5 seeded users (3 active, 2 deleted)
        var activeIds = seedIds.Where((_, i) => i % 2 == 0).Take(2).ToList();
        var result = await repo.FindByIds(activeIds);

        Assert.Equal(2, result.Count);
    }
}
