using Application.Common.Interfaces;

namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using global::Common.Generators;
using global::Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

public sealed class CreateStaffUnderManagerCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ITourManagerAssignmentRepository assignmentRepository,
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        ICurrentUser _currentUser)
    : ICommandHandler<CreateStaffUnderManagerCommand, ErrorOr<StaffMemberDto>>
{
    public async Task<ErrorOr<StaffMemberDto>> Handle(
        CreateStaffUnderManagerCommand request,
        CancellationToken cancellationToken)
    {
        bool isAdmin = false;
        if (_currentUser.Id.HasValue)
        {
            var rolesResult = await roleRepository.FindByUserId(_currentUser.Id.Value.ToString(), cancellationToken);
            if (!rolesResult.IsError && rolesResult.Value.Any(r => r.Name == "Admin"))
            {
                isAdmin = true;
            }
        }

        if (request.ManagerId != _currentUser.Id && !isAdmin)
            return Error.Forbidden(ErrorConstants.Authorization.UnauthorizedDescription);

        var manager = await userRepository.FindById(request.ManagerId);
        if (manager is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var roleName = request.Request.StaffType switch
        {
            1 => "TourDesigner",
            2 => "TourGuide",
            _ => throw new InvalidOperationException($"Invalid StaffType: {request.Request.StaffType}")
        };

        var roleResult = await roleRepository.FindByNameAsync(roleName);
        if (roleResult.IsError || roleResult.Value is null)
            return Error.NotFound("Role.NotFound", $"Role '{roleName}' not found.");
        var roleId = roleResult.Value.Id;

        var isUnique = await userRepository.IsEmailUnique(request.Request.Email);
        if (!isUnique)
            return Error.Conflict(
                ErrorConstants.User.DuplicateEmailCode,
                ErrorConstants.User.DuplicateEmailDescription);

        var tempPassword = "password123";
        var userEntity = UserEntity.Create(
            request.Request.Email,
            request.Request.FullName,
            request.Request.Email,
            passwordHasher.HashPassword(tempPassword),
            "admin",
            null,
            forcePasswordChange: true);

        // Use ExecuteTransactionAsync to be compatible with NpgsqlRetryingExecutionStrategy.
        // All operations use AddAsync (no internal SaveChangesAsync) — the single SaveChanges
        // is called by ExecuteTransactionAsync at the end of the lambda.
        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            var userRepo = unitOfWork.GenericRepository<UserEntity>();
            await userRepo.AddAsync(userEntity);

            var settingsRepo = unitOfWork.GenericRepository<UserSettingEntity>();
            var settings = UserSettingEntity.Create(userEntity.Id, "admin");
            await settingsRepo.AddAsync(settings);

            await roleRepository.AddUser(userEntity.Id, [roleId]);

            var entityType = request.Request.StaffType switch
            {
                1 => AssignedEntityType.TourDesigner,
                2 => AssignedEntityType.TourGuide,
                _ => throw new InvalidOperationException($"Invalid StaffType: {request.Request.StaffType}")
            };

            var assignment = TourManagerAssignmentEntity.Create(
                request.ManagerId,
                entityType,
                userEntity.Id,
                null,
                null,
                _currentUser.Id is not null ? _currentUser.Id.ToString()! : "system");

            await assignmentRepository.AssignAsync(assignment, cancellationToken);
        });

        var displayRoleName = request.Request.StaffType switch
        {
            1 => "Tour Designer",
            2 => "Tour Guide",
            _ => "Staff"
        };

        return new StaffMemberDto(
            userEntity.Id,
            userEntity.FullName ?? userEntity.Username,
            userEntity.Email,
            userEntity.AvatarUrl,
            displayRoleName,
            "Member",
            userEntity.Status.ToString(),
            []);
    }
}
