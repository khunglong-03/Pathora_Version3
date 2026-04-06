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
        IPasswordHasher passwordHasher)
    : ICommandHandler<CreateStaffUnderManagerCommand, ErrorOr<StaffMemberDto>>
{
    public async Task<ErrorOr<StaffMemberDto>> Handle(
        CreateStaffUnderManagerCommand request,
        CancellationToken cancellationToken)
    {
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

        var tempPassword = global::Common.Generators.PasswordGenerator.Generate();
        var userEntity = UserEntity.Create(
            request.Request.Email,
            request.Request.FullName,
            request.Request.Email,
            passwordHasher.HashPassword(tempPassword),
            "admin",
            null,
            forcePasswordChange: true);

        UserEntity? createdUser = null;

        try
        {
            await unitOfWork.BeginTransactionAsync();

            await userRepository.Create(userEntity);
            createdUser = userEntity;

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
                "admin");

            await assignmentRepository.AssignAsync(assignment, cancellationToken);

            await unitOfWork.CommitTransactionAsync();
        }
        catch
        {
            await unitOfWork.RollbackTransactionAsync();

            if (createdUser is not null)
            {
                createdUser.SoftDelete("admin");
                userRepository.Update(createdUser);
                await unitOfWork.SaveChangeAsync();
            }

            throw;
        }

        var displayRoleName = request.Request.StaffType switch
        {
            1 => "Tour Designer",
            2 => "Tour Guide",
            _ => "Staff"
        };

        return new StaffMemberDto(
            createdUser!.Id,
            createdUser.FullName ?? createdUser.Username,
            createdUser.Email,
            createdUser.AvatarUrl,
            displayRoleName,
            "Member",
            createdUser.IsDeleted ? "Khóa" : "Hoạt động");
    }
}
