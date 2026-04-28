using global::Application.Contracts.TourManagerAssignment;
using global::Application.Features.TourManagerAssignment.Queries;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.TourManagerAssignment;

public sealed class GetTourManagerAssignmentsQueryHandlerTests
{
    private readonly ITourManagerAssignmentRepository _repository;
    private readonly GetTourManagerAssignmentsQueryHandler _handler;

    public GetTourManagerAssignmentsQueryHandlerTests()
    {
        _repository = Substitute.For<ITourManagerAssignmentRepository>();
        _handler = new GetTourManagerAssignmentsQueryHandler(_repository);
    }

    [Fact]
    public async Task Handle_WithAssignments_ReturnsSummariesWithCorrectCounts()
    {
        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();
        var guideId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var assignments = new List<TourManagerAssignmentEntity>
        {
            CreateAssignment(managerId, AssignedEntityType.TourOperator, designerId, null, null),
            CreateAssignment(managerId, AssignedEntityType.TourGuide, guideId, null, null),
            CreateAssignment(managerId, AssignedEntityType.Tour, null, tourId, null)
        };

        _repository.GetAllSummariesAsync(Arg.Any<CancellationToken>()).Returns(assignments);

        var result = await _handler.Handle(new GetTourManagerAssignmentsQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        var summary = Assert.Single(result.Value);
        Assert.Equal(managerId, summary.ManagerId);
        Assert.Equal(1, summary.DesignerCount);
        Assert.Equal(1, summary.GuideCount);
        Assert.Equal(1, summary.TourCount);
    }

    [Fact]
    public async Task Handle_NoAssignments_ReturnsEmptyList()
    {
        _repository.GetAllSummariesAsync(Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());

        var result = await _handler.Handle(new GetTourManagerAssignmentsQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task Handle_WithMixedAssignments_ReturnsCorrectCounts()
    {
        var managerId = Guid.NewGuid();
        var designer1Id = Guid.NewGuid();
        var designer2Id = Guid.NewGuid();
        var guide1Id = Guid.NewGuid();
        var tour1Id = Guid.NewGuid();
        var tour2Id = Guid.NewGuid();
        var assignments = new List<TourManagerAssignmentEntity>
        {
            CreateAssignment(managerId, AssignedEntityType.TourOperator, designer1Id, null, null),
            CreateAssignment(managerId, AssignedEntityType.TourOperator, designer2Id, null, null),
            CreateAssignment(managerId, AssignedEntityType.TourGuide, guide1Id, null, null),
            CreateAssignment(managerId, AssignedEntityType.Tour, null, tour1Id, null),
            CreateAssignment(managerId, AssignedEntityType.Tour, null, tour2Id, null)
        };

        _repository.GetAllSummariesAsync(Arg.Any<CancellationToken>()).Returns(assignments);

        var result = await _handler.Handle(new GetTourManagerAssignmentsQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        var summary = Assert.Single(result.Value);
        Assert.Equal(2, summary.DesignerCount);
        Assert.Equal(1, summary.GuideCount);
        Assert.Equal(2, summary.TourCount);
    }

    [Fact]
    public async Task Handle_FilterByManagerId_ReturnsSingleManager()
    {
        var manager1Id = Guid.NewGuid();
        var manager2Id = Guid.NewGuid();
        var designer1Id = Guid.NewGuid();
        var designer2Id = Guid.NewGuid();
        var assignments = new List<TourManagerAssignmentEntity>
        {
            CreateAssignment(manager1Id, AssignedEntityType.TourOperator, designer1Id, null, null),
            CreateAssignment(manager2Id, AssignedEntityType.TourOperator, designer2Id, null, null)
        };

        _repository.GetAllSummariesAsync(Arg.Any<CancellationToken>()).Returns(assignments);

        var result = await _handler.Handle(new GetTourManagerAssignmentsQuery(manager1Id), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value);
        Assert.Equal(manager1Id, result.Value[0].ManagerId);
    }

    [Fact]
    public async Task Handle_MultipleManagers_ReturnsAllManagers()
    {
        var manager1Id = Guid.NewGuid();
        var manager2Id = Guid.NewGuid();
        var designer1Id = Guid.NewGuid();
        var designer2Id = Guid.NewGuid();
        var assignments = new List<TourManagerAssignmentEntity>
        {
            CreateAssignment(manager1Id, AssignedEntityType.TourOperator, designer1Id, null, null),
            CreateAssignment(manager2Id, AssignedEntityType.TourOperator, designer2Id, null, null)
        };

        _repository.GetAllSummariesAsync(Arg.Any<CancellationToken>()).Returns(assignments);

        var result = await _handler.Handle(new GetTourManagerAssignmentsQuery(), CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Count);
    }

    private static TourManagerAssignmentEntity CreateAssignment(
        Guid managerId,
        AssignedEntityType entityType,
        Guid? userId,
        Guid? tourId,
        AssignedRoleInTeam? role)
    {
        var assignment = TourManagerAssignmentEntity.Create(
            managerId, entityType, userId, tourId, role, "system");
        assignment.TourManager = new global::Domain.Entities.UserEntity
        {
            Id = managerId,
            Username = "manager",
            FullName = "Test Manager",
            Email = "manager@test.com"
        };
        return assignment;
    }
}
