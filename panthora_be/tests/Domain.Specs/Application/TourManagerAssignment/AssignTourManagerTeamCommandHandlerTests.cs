using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;

namespace Domain.Specs.Application.TourManagerAssignment;

public sealed class AssignTourManagerTeamCommandHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ITourManagerAssignmentRepository _repository;
    private readonly ITourInstanceRepository _tourInstanceRepository;
    private readonly global::Contracts.Interfaces.IUser _user;
    private readonly AssignTourManagerTeamCommandHandler _handler;

    public AssignTourManagerTeamCommandHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _repository = Substitute.For<ITourManagerAssignmentRepository>();
        _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        _user = Substitute.For<global::Contracts.Interfaces.IUser>();
        _user.Id.Returns("system");
        _handler = new AssignTourManagerTeamCommandHandler(
            _userRepository,
            _roleRepository,
            _repository,
            _tourInstanceRepository,
            _user);
    }

    [Fact]
    public async Task Handle_ValidTourDesignerAssignment_CreatesRecord()
    {
        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var designer = CreateTourDesignerUser(designerId, "designer@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(designerId).Returns(designer);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { designer });
        _roleRepository.FindByUserId(designerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "TourDesigner" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { designerId, new List<RoleEntity> { new() { Name = "TourDesigner" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(designerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.TourManagerId == managerId &&
                e.AssignedUserId == designerId &&
                e.AssignedEntityType == AssignedEntityType.TourDesigner),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidTourGuideAssignment_CreatesRecord()
    {
        var managerId = Guid.NewGuid();
        var guideId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var guide = CreateTourGuideUser(guideId, "guide@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(guideId).Returns(guide);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(guideId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { guide });
        _roleRepository.FindByUserId(guideId.ToString()).Returns(new List<RoleEntity> { new() { Name = "TourGuide" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(guideId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { guideId, new List<RoleEntity> { new() { Name = "TourGuide" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(guideId, null, 2, 2)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.TourManagerId == managerId &&
                e.AssignedUserId == guideId &&
                e.AssignedEntityType == AssignedEntityType.TourGuide),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidTourAssignment_CreatesRecordWithNullUserId()
    {
        var managerId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var tourInstance = CreateTourInstance(tourId);

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _tourInstanceRepository.FindById(tourId, true).Returns(tourInstance);
        _tourInstanceRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(tourId)), Arg.Any<CancellationToken>()).Returns(new List<TourInstanceEntity> { tourInstance });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(null, tourId, 3, null)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _repository.Received(1).AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.TourManagerId == managerId &&
                e.AssignedUserId == null &&
                e.AssignedTourId == tourId &&
                e.AssignedEntityType == AssignedEntityType.Tour),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DuplicateAssignment_ReturnsConflict()
    {
        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var designer = CreateTourDesignerUser(designerId, "designer@example.com");
        var existingAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, designerId, null, null, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity> { existingAssignment });
        _userRepository.FindById(designerId).Returns(designer);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { designer });
        _roleRepository.FindByUserId(designerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "TourDesigner" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { designerId, new List<RoleEntity> { new() { Name = "TourDesigner" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(designerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Conflict, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.DuplicateUser", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_UserAlreadyAssignedToManagerTeam_ReturnsConflict()
    {
        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var designer = CreateTourDesignerUser(designerId, "designer@example.com");
        var existingAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, designerId, null, null, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity> { existingAssignment });
        _userRepository.FindById(designerId).Returns(designer);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { designer });
        _roleRepository.FindByUserId(designerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "TourDesigner" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(designerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { designerId, new List<RoleEntity> { new() { Name = "TourDesigner" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(designerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Conflict, result.FirstError.Type);
    }

    [Fact]
    public async Task Handle_UserNotFound_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();
        var nonexistentId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(nonexistentId).Returns((UserEntity?)null);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(nonexistentId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity>());

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(nonexistentId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_ManagerNotFound_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();

        _userRepository.FindById(managerId).Returns((UserEntity?)null);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity>());

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("TourManager.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_UserIsManager_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var anotherManagerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var anotherManager = CreateManagerUser(anotherManagerId, "another@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(anotherManagerId).Returns(anotherManager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(anotherManagerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { anotherManager });
        _roleRepository.FindByUserId(anotherManagerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(anotherManagerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { anotherManagerId, new List<RoleEntity> { new() { Name = "Manager" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(anotherManagerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.ManagerCannotBeAssigned", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_SelfAssignment_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(managerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.SelfAssignment", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_UserDoesNotHaveTourDesignerOrTourGuideRole_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var customerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var customer = new UserEntity { Id = customerId, Email = "customer@example.com", Username = "customer" };

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(customerId).Returns(customer);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(customerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { customer });
        _roleRepository.FindByUserId(customerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Customer" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(customerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { customerId, new List<RoleEntity> { new() { Name = "Customer" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(customerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.InvalidRole", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_ManagerRoleUserAssigned_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var otherManagerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");
        var otherManager = CreateManagerUser(otherManagerId, "manager2@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _userRepository.FindById(otherManagerId).Returns(otherManager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(otherManagerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { otherManager });
        _roleRepository.FindByUserId(otherManagerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(otherManagerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { otherManagerId, new List<RoleEntity> { new() { Name = "Manager" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(otherManagerId, null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.ManagerCannotBeAssigned", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_InvalidManagerIdFormat_ReturnsValidationError()
    {
        var command = new AssignTourManagerTeamCommand("not-a-guid", new List<AssignmentItem>());

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
    }

    [Fact]
    public async Task Handle_EmptyAssignmentsList_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>());

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManagerAssignment.EmptyAssignments", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_UserIsNotManagerRole_ReturnsValidationError()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Admin" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Admin" } } } });

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(Guid.NewGuid(), null, 1, 1)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Validation, result.FirstError.Type);
        Assert.Equal("TourManager.InvalidRole", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_TourNotFound_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var manager = CreateManagerUser(managerId, "manager@example.com");

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new List<UserEntity> { manager });
        _roleRepository.FindByUserId(managerId.ToString()).Returns(new List<RoleEntity> { new() { Name = "Manager" } });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(l => l.Contains(managerId)), Arg.Any<CancellationToken>()).Returns(new Dictionary<Guid, List<RoleEntity>> { { managerId, new List<RoleEntity> { new() { Name = "Manager" } } } });
        _repository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>()).Returns(new List<TourManagerAssignmentEntity>());
        _tourInstanceRepository.FindById(tourId, true).Returns((TourInstanceEntity?)null);
        _tourInstanceRepository.FindByIds(Arg.Is<List<Guid>>(l => l.Contains(tourId)), Arg.Any<CancellationToken>()).Returns(new List<TourInstanceEntity>());

        var command = new AssignTourManagerTeamCommand(managerId.ToString(), new List<AssignmentItem>
        {
            new(null, tourId, 3, null)
        });

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }

    private static UserEntity CreateManagerUser(Guid id, string email) => new()
    {
        Id = id,
        Username = "manager",
        Email = email,
        IsDeleted = false
    };

    private static UserEntity CreateTourDesignerUser(Guid id, string email) => new()
    {
        Id = id,
        Username = "designer",
        Email = email,
        IsDeleted = false
    };

    private static UserEntity CreateTourGuideUser(Guid id, string email) => new()
    {
        Id = id,
        Username = "guide",
        Email = email,
        IsDeleted = false
    };

    private static TourInstanceEntity CreateTourInstance(Guid id) => new()
    {
        Id = id,
        TourName = "Test Tour",
        IsDeleted = false
    };
}
