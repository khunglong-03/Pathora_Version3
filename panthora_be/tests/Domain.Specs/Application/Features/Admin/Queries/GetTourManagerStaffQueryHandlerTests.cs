using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetTourManagerStaffQueryHandlerTests
{
    private readonly IUserRepository _userRepository;
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly GetTourManagerStaffQueryHandler _handler;

    public GetTourManagerStaffQueryHandlerTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _handler = new GetTourManagerStaffQueryHandler(_userRepository, _assignmentRepository);
    }

    [Fact]
    public async Task Handle_ManagerHasStaff_ReturnsGroupedStaff()
    {
        var managerId = Guid.NewGuid();
        var designerId = Guid.NewGuid();
        var guideId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager1",
            Email = "manager@example.com",
            PhoneNumber = "+84 123 456 001",
            FullName = "Manager One",
            Status = UserStatus.Active,
            VerifyStatus = VerifyStatus.Verified,
            IsDeleted = false
        };
        var designer = new UserEntity
        {
            Id = designerId,
            Username = "designer1",
            Email = "designer@example.com",
            FullName = "Designer One",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var guide = new UserEntity
        {
            Id = guideId,
            Username = "guide1",
            Email = "guide@example.com",
            FullName = "Guide One",
            Status = UserStatus.Active,
            IsDeleted = false
        };

        var designerAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, designerId, null, AssignedRoleInTeam.Member, "system");
        var guideAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourGuide, guideId, null, AssignedRoleInTeam.Lead, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { designerAssignment, guideAssignment });
        _userRepository.FindById(designerId).Returns(designer);
        _userRepository.FindById(guideId).Returns(guide);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Manager One", result.Value.Manager.FullName);
        Assert.Equal(2, result.Value.Staff.Count);
        Assert.Contains(result.Value.Staff, s => s.Role == "Tour Designer");
        Assert.Contains(result.Value.Staff, s => s.Role == "Tour Guide");
    }

    [Fact]
    public async Task Handle_ManagerHasNoStaff_ReturnsEmptyList()
    {
        var managerId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager2",
            Email = "manager2@example.com",
            FullName = "Manager Two",
            Status = UserStatus.Active,
            VerifyStatus = VerifyStatus.Verified,
            IsDeleted = false
        };
        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity>());

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("Manager Two", result.Value.Manager.FullName);
        Assert.Empty(result.Value.Staff);
    }

    [Fact]
    public async Task Handle_ManagerNotFound_ReturnsNotFound()
    {
        var managerId = Guid.NewGuid();
        _userRepository.FindById(managerId).Returns((UserEntity?)null);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal(ErrorType.NotFound, result.FirstError.Type);
        Assert.Equal("User.NotFound", result.FirstError.Code);
    }

    [Fact]
    public async Task Handle_StaffUserNotFound_SkipsStaffMember()
    {
        var managerId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager3",
            Email = "manager3@example.com",
            FullName = "Manager Three",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var designerAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, Guid.NewGuid(), null, AssignedRoleInTeam.Member, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { designerAssignment });
        _userRepository.FindById(designerAssignment.AssignedUserId!.Value).Returns((UserEntity?)null);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Staff);
    }

    [Fact]
    public async Task Handle_AssignmentWithNullUserId_SkipsAssignment()
    {
        var managerId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager4",
            Email = "manager4@example.com",
            FullName = "Manager Four",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var assignmentWithTourId = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.Tour, null, Guid.NewGuid(), null, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { assignmentWithTourId });

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Empty(result.Value.Staff);
    }
}
