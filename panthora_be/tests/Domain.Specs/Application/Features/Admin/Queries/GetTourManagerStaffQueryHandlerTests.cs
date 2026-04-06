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

    [Fact]
    public async Task Handle_ActiveStaff_ReturnsStatusHoatDong()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager5",
            Email = "manager5@example.com",
            FullName = "Manager Five",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var activeStaff = new UserEntity
        {
            Id = staffId,
            Username = "staff5",
            Email = "staff5@example.com",
            FullName = "Active Staff",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var assignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, staffId, null, AssignedRoleInTeam.Member, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { assignment });
        _userRepository.FindById(staffId).Returns(activeStaff);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Staff);
        Assert.Equal("Hoạt động", result.Value.Staff[0].Status);
    }

    [Fact]
    public async Task Handle_DeletedStaff_ReturnsStatusKhoa()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager6",
            Email = "manager6@example.com",
            FullName = "Manager Six",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var deletedStaff = new UserEntity
        {
            Id = staffId,
            Username = "staff6",
            Email = "staff6@example.com",
            FullName = "Deleted Staff",
            Status = UserStatus.Inactive,
            IsDeleted = true
        };
        var assignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, staffId, null, AssignedRoleInTeam.Member, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { assignment });
        _userRepository.FindById(staffId).Returns(deletedStaff);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Staff);
        Assert.Equal("Khóa", result.Value.Staff[0].Status);
    }

    [Fact]
    public async Task Handle_MixedActiveAndDeletedStaff_ReturnsCorrectStatusForEach()
    {
        var managerId = Guid.NewGuid();
        var activeId = Guid.NewGuid();
        var deletedId = Guid.NewGuid();
        var manager = new UserEntity
        {
            Id = managerId,
            Username = "manager7",
            Email = "manager7@example.com",
            FullName = "Manager Seven",
            Status = UserStatus.Active,
            IsDeleted = false
        };
        var activeStaff = new UserEntity
        {
            Id = activeId,
            Username = "staff7a",
            Email = "staff7a@example.com",
            FullName = "Active Staff 7",
            IsDeleted = false
        };
        var deletedStaff = new UserEntity
        {
            Id = deletedId,
            Username = "staff7b",
            Email = "staff7b@example.com",
            FullName = "Deleted Staff 7",
            IsDeleted = true
        };
        var assignment1 = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourDesigner, activeId, null, AssignedRoleInTeam.Member, "system");
        var assignment2 = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourGuide, deletedId, null, AssignedRoleInTeam.Lead, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { assignment1, assignment2 });
        _userRepository.FindById(activeId).Returns(activeStaff);
        _userRepository.FindById(deletedId).Returns(deletedStaff);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Staff.Count);
        Assert.Contains(result.Value.Staff, s => s.FullName == "Active Staff 7" && s.Status == "Hoạt động");
        Assert.Contains(result.Value.Staff, s => s.FullName == "Deleted Staff 7" && s.Status == "Khóa");
    }
}
