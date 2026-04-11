using Application.Contracts.Admin;
using Application.Features.Admin.Commands.CreateStaffUnderManager;
using Application.Common.Interfaces;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Commands;

public sealed class CreateStaffUnderManagerCommandHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUser _currentUser;
    private readonly CreateStaffUnderManagerCommandHandler _handler;

    public CreateStaffUnderManagerCommandHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _passwordHasher = Substitute.For<IPasswordHasher>();
        _currentUser = Substitute.For<ICurrentUser>();
        _handler = new CreateStaffUnderManagerCommandHandler(
            _userRepository,
            _roleRepository,
            _assignmentRepository,
            _unitOfWork,
            _passwordHasher,
            _currentUser);

        // Default transaction mocks (IUnitOfWork methods take no arguments)
        _unitOfWork.BeginTransactionAsync().Returns(Task.CompletedTask);
        _unitOfWork.CommitTransactionAsync().Returns(Task.CompletedTask);
        _unitOfWork.RollbackTransactionAsync().Returns(Task.CompletedTask);
        _unitOfWork.SaveChangeAsync(Arg.Any<CancellationToken>()).Returns(0);

        var genericSettingsRepo = Substitute.For<IRepository<UserSettingEntity>>();
        genericSettingsRepo.AddAsync(Arg.Any<UserSettingEntity>()).Returns(Task.CompletedTask);
        _unitOfWork.GenericRepository<UserSettingEntity>().Returns(genericSettingsRepo);

        // Default role repo mocks
        _roleRepository.AddUser(Arg.Any<Guid>(), Arg.Any<List<int>>()).Returns(Task.FromResult<ErrorOr<Success>>(new Success()));
    }

    [Fact]
    public async Task Handle_ValidTourDesignerStaffType_CreatesUserAndAssignment()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManager(managerId);
        var designerRole = new RoleEntity { Id = 4, Name = "TourDesigner" };

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.IsEmailUnique(Arg.Any<string>()).Returns(true);
        _roleRepository.FindByNameAsync("TourDesigner").Returns(Task.FromResult<ErrorOr<RoleEntity?>>(designerRole));
        _userRepository.Create(Arg.Any<UserEntity>()).Returns(Task.CompletedTask);
        _assignmentRepository.AssignAsync(Arg.Any<TourManagerAssignmentEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var command = new CreateStaffUnderManagerCommand(
            managerId,
            new CreateStaffUnderManagerRequest("newdesigner@test.com", "New Designer", 1));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _userRepository.Received(1).Create(Arg.Any<UserEntity>());
        await _assignmentRepository.Received(1).AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.TourManagerId == managerId &&
                e.AssignedEntityType == AssignedEntityType.TourDesigner),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidTourGuideStaffType_CreatesUserAndAssignment()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManager(managerId);
        var guideRole = new RoleEntity { Id = 7, Name = "TourGuide" };

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.IsEmailUnique(Arg.Any<string>()).Returns(true);
        _roleRepository.FindByNameAsync("TourGuide").Returns(Task.FromResult<ErrorOr<RoleEntity?>>(guideRole));
        _userRepository.Create(Arg.Any<UserEntity>()).Returns(Task.CompletedTask);
        _assignmentRepository.AssignAsync(Arg.Any<TourManagerAssignmentEntity>(), Arg.Any<CancellationToken>())
            .Returns(Task.CompletedTask);

        var command = new CreateStaffUnderManagerCommand(
            managerId,
            new CreateStaffUnderManagerRequest("newguide@test.com", "New Guide", 2));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _assignmentRepository.Received(1).AssignAsync(
            Arg.Is<TourManagerAssignmentEntity>(e =>
                e.AssignedEntityType == AssignedEntityType.TourGuide),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_InvalidManagerId_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();

        _userRepository.FindById(managerId).Returns((UserEntity?)null);

        var command = new CreateStaffUnderManagerCommand(
            managerId,
            new CreateStaffUnderManagerRequest("test@example.com", "Test User", 1));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ReturnsConflict()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManager(managerId);
        var designerRole = new RoleEntity { Id = 4, Name = "TourDesigner" };

        _userRepository.FindById(managerId).Returns(manager);
        _roleRepository.FindByNameAsync("TourDesigner").Returns(Task.FromResult<ErrorOr<RoleEntity?>>(designerRole));
        _userRepository.IsEmailUnique(Arg.Any<string>()).Returns(false);

        var command = new CreateStaffUnderManagerCommand(
            managerId,
            new CreateStaffUnderManagerRequest("existing@example.com", "Test User", 1));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.Conflict, result.FirstError.Type);
    }

    [Fact]
    public async Task Handle_RoleNotFound_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();
        var manager = CreateManager(managerId);

        _userRepository.FindById(managerId).Returns(manager);
        _userRepository.IsEmailUnique(Arg.Any<string>()).Returns(true);
        _roleRepository.FindByNameAsync("TourDesigner").Returns(Task.FromResult<ErrorOr<RoleEntity?>>((RoleEntity?)null));

        var command = new CreateStaffUnderManagerCommand(
            managerId,
            new CreateStaffUnderManagerRequest("new@test.com", "New Staff", 1));

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
    }

    private static UserEntity CreateManager(Guid id) => new()
    {
        Id = id,
        Username = "manager",
        Email = "manager@test.com",
        FullName = "Manager",
        Status = UserStatus.Active,
        IsDeleted = false
    };
}
