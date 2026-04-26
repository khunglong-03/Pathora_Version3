using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using global::Common.Generators;
using global::Contracts.Interfaces;

namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

public sealed record CreateStaffUnderManagerCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("request")] CreateStaffUnderManagerRequest Request) : ICommand<ErrorOr<StaffMemberDto>>;



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

        var email = request.Request.Email.Trim().ToLower();
        var username = !string.IsNullOrWhiteSpace(request.Request.Username)
            ? request.Request.Username.Trim().ToLower()
            : email;

        // Check Email Uniqueness
        var isEmailUnique = await userRepository.IsEmailUnique(email);
        if (!isEmailUnique)
            return Error.Conflict(
                ErrorConstants.User.DuplicateEmailCode,
                ErrorConstants.User.DuplicateEmailDescription);

        // Check Username Uniqueness
        var isUsernameUnique = await userRepository.IsUsernameUnique(username);
        if (!isUsernameUnique)
            return Error.Conflict(
                "User.DuplicateUsername",
                "Username already exists.");

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

        var password = !string.IsNullOrEmpty(request.Request.Password) 
            ? request.Request.Password 
            : "password123";

        var userEntity = UserEntity.Create(
            username,
            request.Request.FullName.Trim(),
            email,
            passwordHasher.HashPassword(password),
            "admin",
            null,
            forcePasswordChange: string.IsNullOrEmpty(request.Request.Password));

        userEntity.VerifyStatus = VerifyStatus.Verified;
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


public sealed class CreateStaffUnderManagerCommandValidator : AbstractValidator<CreateStaffUnderManagerCommand>
{
    public CreateStaffUnderManagerCommandValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty()
            .WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.Request.Username)
            .MinimumLength(3)
            .MaximumLength(50)
            .Matches(@"^[a-zA-Z0-9._]+$")
            .WithMessage("Username must be between 3 and 50 characters and contain only letters, numbers, dots, or underscores.")
            .When(x => !string.IsNullOrWhiteSpace(x.Request.Username));

        RuleFor(x => x.Request.Email)
            .NotEmpty()
            .WithMessage(ValidationMessages.EmailRequired)
            .EmailAddress()
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.Request.FullName)
            .NotEmpty()
            .WithMessage(ValidationMessages.FullNameRequired);

        RuleFor(x => x.Request.StaffType)
            .InclusiveBetween(1, 2)
            .WithMessage(ValidationMessages.StaffTypeInvalid);

        RuleFor(x => x.Request.Password)
            .MinimumLength(6)
            .When(x => !string.IsNullOrEmpty(x.Request.Password))
            .WithMessage(ValidationMessages.PasswordMinLength);
    }
}
