using global::Application.Features.TourManagerAssignment.Commands.RemoveTourManagerAssignment;
using global::Domain.Common.Repositories;
using global::Domain.Enums;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.TourManagerAssignment;

public sealed class RemoveTourManagerAssignmentCommandHandlerTests
{
    private readonly ITourManagerAssignmentRepository _repository;
    private readonly RemoveTourManagerAssignmentCommandHandler _handler;

    public RemoveTourManagerAssignmentCommandHandlerTests()
    {
        _repository = Substitute.For<ITourManagerAssignmentRepository>();
        _handler = new RemoveTourManagerAssignmentCommandHandler(_repository);
    }

    [Fact]
    public async Task Handle_ExistingUserAssignment_DeletesAndReturnsSuccess()
    {
        var managerId = Guid.NewGuid();
        var assignedUserId = Guid.NewGuid();
        var command = new RemoveTourManagerAssignmentCommand(managerId, assignedUserId, null, 1);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).RemoveAsync(
            managerId,
            assignedUserId,
            null,
            AssignedEntityType.TourOperator,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ExistingTourAssignment_DeletesAndReturnsSuccess()
    {
        var managerId = Guid.NewGuid();
        var assignedTourId = Guid.NewGuid();
        var command = new RemoveTourManagerAssignmentCommand(managerId, null, assignedTourId, 3);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).RemoveAsync(
            managerId,
            null,
            assignedTourId,
            AssignedEntityType.Tour,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_NonExistentAssignment_RepositoryReturnsNoOp()
    {
        var managerId = Guid.NewGuid();
        var assignedUserId = Guid.NewGuid();
        var command = new RemoveTourManagerAssignmentCommand(managerId, assignedUserId, null, 1);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).RemoveAsync(
            managerId,
            assignedUserId,
            null,
            AssignedEntityType.TourOperator,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_TourGuideAssignment_DeletesCorrectEntityType()
    {
        var managerId = Guid.NewGuid();
        var guideId = Guid.NewGuid();
        var command = new RemoveTourManagerAssignmentCommand(managerId, guideId, null, 2);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).RemoveAsync(
            managerId,
            guideId,
            null,
            AssignedEntityType.TourGuide,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_MultipleRemoves_CallsRepositoryForEach()
    {
        var managerId = Guid.NewGuid();
        var user1Id = Guid.NewGuid();
        var user2Id = Guid.NewGuid();

        var command1 = new RemoveTourManagerAssignmentCommand(managerId, user1Id, null, 1);
        var command2 = new RemoveTourManagerAssignmentCommand(managerId, user2Id, null, 2);

        await _handler.Handle(command1, CancellationToken.None);
        await _handler.Handle(command2, CancellationToken.None);

        await _repository.Received(2).RemoveAsync(
            Arg.Any<Guid>(),
            Arg.Any<Guid?>(),
            Arg.Any<Guid?>(),
            Arg.Any<AssignedEntityType>(),
            Arg.Any<CancellationToken>());
    }
}
