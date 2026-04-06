using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Domain.Specs.Infrastructure;

public sealed class TourManagerAssignmentConstraintTests
{
    private static AppDbContext CreateInMemoryContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void TourManagerAssignmentEntity_HasCorrectProperties()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();

        var manager = new UserEntity { Id = managerId, Username = "manager", Email = "m@test.com" };
        var designer = new UserEntity { Id = designerId, Username = "designer", Email = "d@test.com" };
        context.Users.AddRange(manager, designer);
        context.SaveChanges();

        var assignment = TourManagerAssignmentEntity.Create(
            managerId,
            AssignedEntityType.TourDesigner,
            designerId,
            null,
            AssignedRoleInTeam.Lead,
            "admin");

        context.TourManagerAssignments.Add(assignment);
        context.SaveChanges();

        var saved = context.TourManagerAssignments.First();
        Assert.Equal(managerId, saved.TourManagerId);
        Assert.Equal(AssignedEntityType.TourDesigner, saved.AssignedEntityType);
        Assert.Equal(designerId, saved.AssignedUserId);
        Assert.Null(saved.AssignedTourId);
        Assert.Equal(AssignedRoleInTeam.Lead, saved.AssignedRoleInTeam);
    }

    [Fact]
    public void TourManagerAssignmentEntity_Create_SetsIdAndTimestamps()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var assignment = TourManagerAssignmentEntity.Create(
            Guid.NewGuid(),
            AssignedEntityType.TourGuide,
            Guid.NewGuid(),
            null,
            AssignedRoleInTeam.Member,
            "test");

        Assert.NotEqual(Guid.Empty, assignment.Id);
        Assert.Equal("test", assignment.CreatedBy);
        Assert.NotEqual(default, assignment.CreatedOnUtc);
    }

    [Fact]
    public void TourManagerAssignmentEntity_TourAssignment_AllowsNullUserId()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new AppDbContext(options);

        var managerId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var manager = new UserEntity { Id = managerId, Username = "manager", Email = "m@test.com" };
        var tour = new TourInstanceEntity
        {
            Id = tourId,
            TourName = "Test Tour",
            TourCode = "TT",
            ClassificationName = "Test",
            Title = "Test Tour",
            TourInstanceCode = "TT-001",
            IsDeleted = false
        };
        context.Users.Add(manager);
        context.TourInstances.Add(tour);
        context.SaveChanges();

        var assignment = TourManagerAssignmentEntity.Create(
            managerId,
            AssignedEntityType.Tour,
            null,
            tourId,
            null,
            "admin");

        context.TourManagerAssignments.Add(assignment);
        context.SaveChanges();

        var saved = context.TourManagerAssignments.First();
        Assert.Null(saved.AssignedUserId);
        Assert.Equal(tourId, saved.AssignedTourId);
        Assert.Equal(AssignedEntityType.Tour, saved.AssignedEntityType);
    }

    [Fact]
    public void AssignedEntityType_Enum_HasCorrectValues()
    {
        Assert.Equal(1, (int)AssignedEntityType.TourDesigner);
        Assert.Equal(2, (int)AssignedEntityType.TourGuide);
        Assert.Equal(3, (int)AssignedEntityType.Tour);
    }

    [Fact]
    public void AssignedRoleInTeam_Enum_HasCorrectValues()
    {
        Assert.Equal(1, (int)AssignedRoleInTeam.Lead);
        Assert.Equal(2, (int)AssignedRoleInTeam.Member);
    }
}
