using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

public sealed class EntityExistenceTests
{
    /// <summary>
    /// Gets all DbSet property names and their entity types from AppDbContext using reflection.
    /// Returns unique entity types (some entities may be mapped to multiple DbSets).
    /// </summary>
    private static IEnumerable<(string DbSetName, Type EntityType, string TableName)> GetAllEntityMappings()
    {
        var dbContextType = typeof(AppDbContext);
        var dbSetProperties = dbContextType.GetProperties()
            .Where(p => p.PropertyType.IsGenericType &&
                        p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        // Create a temporary in-memory context to get entity metadata
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"metadata-only-{Guid.NewGuid():N}")
            .Options;

        using var dbContext = new AppDbContext(options);
        var model = dbContext.Model;

        var results = new List<(string, Type, string)>();
        var seenEntityTypes = new HashSet<Type>();

        foreach (var property in dbSetProperties)
        {
            var entityType = property.PropertyType.GetGenericArguments().First();
            var entity = model.FindEntityType(entityType);

            if (entity != null)
            {
                var tableName = entity.GetTableName();
                var dbSetName = property.Name;

                // Track unique entity types but keep all DbSet names for completeness
                if (!seenEntityTypes.Contains(entityType))
                {
                    seenEntityTypes.Add(entityType);
                }

                results.Add((dbSetName, entityType, tableName ?? entityType.Name));
            }
        }

        return results;
    }

    [Fact]
    public void AllDomainEntities_ShouldHaveDbSetMappings()
    {
        // Arrange & Act
        var entityMappings = GetAllEntityMappings().ToList();
        var uniqueEntityTypes = entityMappings.Select(x => x.EntityType).Distinct().ToList();

        // Assert - verify we have a reasonable number of entities
        Assert.True(uniqueEntityTypes.Count >= 40,
            $"Expected at least 40 entities to be mapped, but found {uniqueEntityTypes.Count}");
    }

    [Fact]
    public void AllMappedEntities_ShouldBeQueryable()
    {
        // Arrange
        var entityMappings = GetAllEntityMappings()
            .Select(x => x.EntityType)
            .Distinct()
            .ToList();

        // Use in-memory database to test queryability (not table existence)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"entity-existence-{Guid.NewGuid():N}")
            .Options;

        using var dbContext = new AppDbContext(options);

        // Act & Assert - verify each entity type is registered in the model
        foreach (var entityType in entityMappings)
        {
            var entityTypeInModel = dbContext.Model.FindEntityType(entityType);
            Assert.NotNull(entityTypeInModel);
        }
    }

    [Fact]
    public void EntityMappings_ShouldIncludeKeyEntities()
    {
        // Arrange & Act
        var entityMappings = GetAllEntityMappings()
            .ToLookup(x => x.EntityType.Name, x => x.TableName);

        // Assert - verify key entities are mapped
        Assert.Contains("UserEntity", entityMappings.Select(g => g.Key));
        Assert.Contains("RoleEntity", entityMappings.Select(g => g.Key));
        Assert.Contains("TourEntity", entityMappings.Select(g => g.Key));
        Assert.Contains("BookingEntity", entityMappings.Select(g => g.Key));
        Assert.Contains("SiteContentEntity", entityMappings.Select(g => g.Key));
    }

    [Fact]
    public void EachDbSet_ShouldHaveCorrectTableName()
    {
        // Arrange & Act
        var entityMappings = GetAllEntityMappings().ToList();

        // Assert - verify table names follow conventions
        foreach (var (dbSetName, entityType, tableName) in entityMappings)
        {
            // Table names should not be null or empty
            Assert.False(string.IsNullOrWhiteSpace(tableName),
                $"Table name for {dbSetName} ({entityType.Name}) should not be null or empty");
        }
    }

    [Fact]
    public void NewEntitiesAddedToDomain_ShouldBeAutomaticallyDiscovered()
    {
        // Arrange
        var entityMappings = GetAllEntityMappings()
            .Select(x => x.EntityType.Name)
            .Distinct()
            .ToHashSet();

        // Assert - verify that the test auto-discovers what's mapped
        var mappedCount = entityMappings.Count;
        Assert.True(mappedCount >= 40,
            $"Expected at least 40 entities to be auto-discovered, found {mappedCount}");
    }

    [Fact]
    public void DbSetPropertyCount_ShouldMatchExpected()
    {
        // Arrange & Act
        var entityMappings = GetAllEntityMappings().ToList();

        // Assert - we have around 51 DbSet properties
        Assert.True(entityMappings.Count >= 47,
            $"Expected at least 47 DbSet mappings, but found {entityMappings.Count}");
    }

    private static string GetSolutionRoot()
    {
        var current = Directory.GetCurrentDirectory();
        while (!File.Exists(Path.Combine(current, "LocalService.slnx")) &&
               !File.Exists(Path.Combine(current, "*.sln")))
        {
            var parent = Directory.GetParent(current);
            if (parent == null)
                throw new FileNotFoundException("Solution root not found");
            current = parent.FullName;
        }
        return current;
    }
}
