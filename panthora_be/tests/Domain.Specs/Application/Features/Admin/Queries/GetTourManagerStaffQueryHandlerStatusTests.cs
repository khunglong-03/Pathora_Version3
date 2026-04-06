using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetTourManagerStaff;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.Admin.Queries;

public sealed class GetTourManagerStaffQueryHandlerStatusTests
{
    private readonly IUserRepository _userRepository;
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly GetTourManagerStaffQueryHandler _handler;

    public GetTourManagerStaffQueryHandlerStatusTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _handler = new GetTourManagerStaffQueryHandler(_userRepository, _assignmentRepository);
    }

    [Fact]
    public async Task Handle_ActiveStaff_ReturnsStatusHoatDong()
    {
        var managerId = Guid.NewGuid();
        var staffId = Guid.NewGuid();
        var manager = CreateManager(managerId, "Manager", "manager@test.com");
        var activeStaff = CreateStaff(staffId, "Active Designer", "designer@test.com", isDeleted: false);

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
        var manager = CreateManager(managerId, "Manager", "manager@test.com");
        var deletedStaff = CreateStaff(staffId, "Deleted Designer", "deleted@test.com", isDeleted: true);

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
    public async Task Handle_MixedActiveAndDeletedStaff_ReturnsCorrectStatuses()
    {
        var managerId = Guid.NewGuid();
        var activeId = Guid.NewGuid();
        var deletedId = Guid.NewGuid();
        var manager = CreateManager(managerId, "Manager", "manager@test.com");
        var activeStaff = CreateStaff(activeId, "Active Guide", "active@test.com", isDeleted: false);
        var deletedStaff = CreateStaff(deletedId, "Deleted Guide", "deleted@test.com", isDeleted: true);

        var activeAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourGuide, activeId, null, AssignedRoleInTeam.Lead, "system");
        var deletedAssignment = TourManagerAssignmentEntity.Create(
            managerId, AssignedEntityType.TourGuide, deletedId, null, AssignedRoleInTeam.Member, "system");

        _userRepository.FindById(managerId).Returns(manager);
        _assignmentRepository.GetByManagerIdAsync(managerId, Arg.Any<CancellationToken>())
            .Returns(new List<TourManagerAssignmentEntity> { activeAssignment, deletedAssignment });
        _userRepository.FindById(activeId).Returns(activeStaff);
        _userRepository.FindById(deletedId).Returns(deletedStaff);

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Staff.Count);
        Assert.Contains(result.Value.Staff, s => s.FullName == "Active Guide" && s.Status == "Hoạt động");
        Assert.Contains(result.Value.Staff, s => s.FullName == "Deleted Guide" && s.Status == "Khóa");
    }

    private static UserEntity CreateManager(Guid id, string fullName, string email) => new()
    {
        Id = id,
        Username = fullName.ToLowerInvariant(),
        Email = email,
        FullName = fullName,
        Status = UserStatus.Active,
        IsDeleted = false
    };

    private static UserEntity CreateStaff(Guid id, string fullName, string email, bool isDeleted) => new()
    {
        Id = id,
        Username = fullName.ToLowerInvariant().Replace(" ", ""),
        Email = email,
        FullName = fullName,
        Status = UserStatus.Active,
        IsDeleted = isDeleted
    };
}
