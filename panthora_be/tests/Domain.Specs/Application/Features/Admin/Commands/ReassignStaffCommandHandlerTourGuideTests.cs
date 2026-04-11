using Application.Features.Admin.Commands.ReassignStaff;
using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Commands;

public sealed class ReassignStaffCommandHandlerTourGuideTests
{
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly ICurrentUser _currentUser;
    private readonly ReassignStaffCommandHandler _handler;

    public ReassignStaffCommandHandlerTourGuideTests()
    {
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _currentUser = Substitute.For<ICurrentUser>();
        _handler = new ReassignStaffCommandHandler(_assignmentRepository, _currentUser);
    }

    [Fact]
    public async Task Handle_ReassignTourGuideToDifferentManager_RemovesOldCreatesNew()
    {
        var staffId = Guid.NewGuid();
        var oldManagerId = Guid.NewGuid();
        var newManagerId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var existingAssignment = TourManagerAssignmentEntity.Create(
            oldManagerId, AssignedEntityType.TourGuide, staffId, null, AssignedRoleInTeam.Lead, "system");

        typeof(TourManagerAssignmentEntity).BaseType!
            .GetProperty("Id")!
            .SetValue(existingAssignment, assignmentId);

        _assignmentRepository.GetByManagerIdAsync(oldManagerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { existingAssignment });

        var command = new ReassignStaffCommand(oldManagerId, staffId, newManagerId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _assignmentRepository.Received().RemoveByIdAsync(assignmentId, Arg.Any<CancellationToken>());
        await _assignmentRepository.Received().AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.TourManagerId == newManagerId &&
                e.AssignedUserId == staffId &&
                e.AssignedEntityType == AssignedEntityType.TourGuide),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReassignTourDesignerToDifferentManager_PreservesRoleInTeam()
    {
        var staffId = Guid.NewGuid();
        var oldManagerId = Guid.NewGuid();
        var newManagerId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var existingAssignment = TourManagerAssignmentEntity.Create(
            oldManagerId, AssignedEntityType.TourDesigner, staffId, null, AssignedRoleInTeam.Member, "system");

        typeof(TourManagerAssignmentEntity).BaseType!
            .GetProperty("Id")!
            .SetValue(existingAssignment, assignmentId);

        _assignmentRepository.GetByManagerIdAsync(oldManagerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { existingAssignment });

        var command = new ReassignStaffCommand(oldManagerId, staffId, newManagerId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _assignmentRepository.Received().AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.AssignedRoleInTeam == AssignedRoleInTeam.Member),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ReassignTourGuideToSameManager_IsIdempotent()
    {
        var staffId = Guid.NewGuid();
        var managerId = Guid.NewGuid();

        var command = new ReassignStaffCommand(managerId, staffId, managerId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _assignmentRepository.Received(0).RemoveByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _assignmentRepository.Received(0).AssignAsync(
            Arg.Any<TourManagerAssignmentEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_StaffNotAssignedToManager_ReturnsNotFound()
    {
        var staffId = Guid.NewGuid();
        var oldManagerId = Guid.NewGuid();
        var newManagerId = Guid.NewGuid();

        _assignmentRepository.GetByManagerIdAsync(oldManagerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity>());

        var command = new ReassignStaffCommand(oldManagerId, staffId, newManagerId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("Admin.StaffNotAssigned", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_StaffAssignedAsTourType_ReturnsNotFound()
    {
        var tourId = Guid.NewGuid();
        var oldManagerId = Guid.NewGuid();
        var newManagerId = Guid.NewGuid();
        var tourAssignment = TourManagerAssignmentEntity.Create(
            oldManagerId, AssignedEntityType.Tour, null, tourId, null, "system");

        _assignmentRepository.GetByManagerIdAsync(oldManagerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { tourAssignment });

        var command = new ReassignStaffCommand(oldManagerId, tourId, newManagerId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }
}
