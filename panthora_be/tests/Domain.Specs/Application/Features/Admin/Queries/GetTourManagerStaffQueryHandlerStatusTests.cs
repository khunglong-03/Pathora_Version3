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
    private readonly IRoleRepository _roleRepository;
    private readonly ITourManagerAssignmentRepository _assignmentRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository;
    private readonly GetTourManagerStaffQueryHandler _handler;

    public GetTourManagerStaffQueryHandlerStatusTests()
    {
        _userRepository = Substitute.For<IUserRepository>();
        _roleRepository = Substitute.For<IRoleRepository>();
        _assignmentRepository = Substitute.For<ITourManagerAssignmentRepository>();
        _tourInstanceRepository = Substitute.For<ITourInstanceRepository>();
        _tourInstanceRepository.FindByManagerUserIds(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(new List<TourInstanceEntity>());
        _handler = new GetTourManagerStaffQueryHandler(_userRepository, _roleRepository, _assignmentRepository, _tourInstanceRepository);
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
        _userRepository.FindByIds(Arg.Is<List<Guid>>(ids => ids.Contains(staffId)))
            .Returns(new List<UserEntity> { activeStaff });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(ids => ids.Contains(staffId)))
            .Returns(new Dictionary<Guid, List<RoleEntity>>());

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
        _userRepository.FindByIds(Arg.Is<List<Guid>>(ids => ids.Contains(staffId)))
            .Returns(new List<UserEntity> { deletedStaff });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(ids => ids.Contains(staffId)))
            .Returns(new Dictionary<Guid, List<RoleEntity>>());

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
        _userRepository.FindByIds(Arg.Is<List<Guid>>(ids => ids.Contains(activeId) && ids.Contains(deletedId)))
            .Returns(new List<UserEntity> { activeStaff, deletedStaff });
        _roleRepository.FindByUserIds(Arg.Is<List<Guid>>(ids => ids.Contains(activeId) && ids.Contains(deletedId)))
            .Returns(new Dictionary<Guid, List<RoleEntity>>());

        var query = new GetTourManagerStaffQuery(managerId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(2, result.Value.Staff.Count);
        Assert.Contains(result.Value.Staff, s => s.FullName == "Active Guide" && s.Status == "Hoạt động");
        Assert.Contains(result.Value.Staff, s => s.FullName == "Deleted Guide" && s.Status == "Khóa");
    }
}
