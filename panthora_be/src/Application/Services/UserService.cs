using Common.Generators;
using Contracts;
using Contracts.Interfaces;
using Application.Common;
using Application.Common.Interfaces;
using Application.Contracts.User;
using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface IUserService
{
    Task<ErrorOr<PaginatedListWithPermissions<UserVm>>> GetAll(GetAllUserRequest request);
    Task<ErrorOr<UserDetailVm>> GetDetail(Guid id);
    Task<ErrorOr<Guid>> Create(CreateUserRequest request);
    Task<ErrorOr<Success>> Update(UpdateUserRequest request);
    Task<ErrorOr<Success>> UpdateStatus(Guid userId, UserStatus status);
    Task<ErrorOr<Success>> ChangePassword(ChangePasswordRequest request);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<Success>> IsEmailUnique(string email);
}

public class UserService(
    IUser user,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    ICloudinaryService cloudinaryService,
    HotelServiceProviderSupplierMapper? hotelServiceProviderMapper = null)
    : IUserService
{
    private readonly IUser _user = user;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IPasswordHasher _passwordHasher = passwordHasher;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IRoleRepository _roleRepository = roleRepository;
    private readonly ICloudinaryService _cloudinaryService = cloudinaryService;
    private readonly HotelServiceProviderSupplierMapper? _hotelServiceProviderMapper = hotelServiceProviderMapper;

    public async Task<ErrorOr<PaginatedListWithPermissions<UserVm>>> GetAll(GetAllUserRequest request)
    {
        List<UserEntity> users;
        int total;

        if (!string.IsNullOrWhiteSpace(request.RoleName))
        {
            var roleResult = await _roleRepository.FindByNameAsync(request.RoleName);
            if (roleResult.IsError || roleResult.Value == null)
                return new PaginatedListWithPermissions<UserVm>(0, [], []);

            var roleId = roleResult.Value.Id;
            var allUserRolesResult = await _roleRepository.FindAllUserRoles();
            var allUserIdsWithRole = allUserRolesResult.IsError
                ? new List<Guid>()
                : allUserRolesResult.Value.Where(ur => ur.RoleId == roleId).Select(ur => ur.UserId).ToList();

            if (allUserIdsWithRole.Count == 0)
                return new PaginatedListWithPermissions<UserVm>(0, [], []);

            users = await _userRepository.FindAll(
                request.TextSearch,
                request.DepartmentId == Guid.Empty ? null : request.DepartmentId,
                request.PageNumber,
                request.PageSize,
                allUserIdsWithRole);

            total = await _userRepository.CountAll(
                request.TextSearch,
                request.DepartmentId == Guid.Empty ? null : request.DepartmentId,
                allUserIdsWithRole);
        }
        else
        {
            users = await _userRepository.FindAll(
                request.TextSearch,
                request.DepartmentId == Guid.Empty ? null : request.DepartmentId,
                request.PageNumber,
                request.PageSize);

            total = await _userRepository.CountAll(
                request.TextSearch,
                request.DepartmentId == Guid.Empty ? null : request.DepartmentId);
        }

        // Batch load tất cả roles trong 1 query, tránh N+1
        var userIds = users.Select(u => u.Id).ToList();
        var rolesMapResult = await _roleRepository.FindByUserIds(userIds);
        var rolesMap = rolesMapResult.IsError
            ? new Dictionary<Guid, List<RoleEntity>>()
            : rolesMapResult.Value;

        var userVms = users.Select(u =>
        {
            var roles = rolesMap.TryGetValue(u.Id, out var r)
                ? r.Select(x => x.Name).ToList()
                : new List<string>();
            return new UserVm(u.Id, u.AvatarUrl, u.Username, u.FullName, u.Email,
                string.Empty, roles, new Dictionary<string, bool>());
        }).ToList();

        return new PaginatedListWithPermissions<UserVm>(total, userVms, new Dictionary<string, bool>());
    }

    public async Task<ErrorOr<UserDetailVm>> GetDetail(Guid id)
    {
        var userEntity = await _userRepository.FindById(id);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var rolesResult = await _roleRepository.FindByUserId(id.ToString());
        var roles = rolesResult.IsError
            ? Enumerable.Empty<Contracts.User.RoleVm>()
            : rolesResult.Value.Select(r => new Contracts.User.RoleVm(r.Id, r.Name));

        return new UserDetailVm(
            userEntity.Id,
            userEntity.Username,
            userEntity.FullName,
            userEntity.Email,
            userEntity.AvatarUrl,
            roles,
            []);
    }

    public async Task<ErrorOr<Guid>> Create(CreateUserRequest request)
    {
        var email = request.Email.Trim().ToLower();
        var isUnique = await _userRepository.IsEmailUnique(email);
        if (!isUnique)
            return Error.Conflict(ErrorConstants.User.DuplicateEmailCode, ErrorConstants.User.DuplicateEmailDescription);

        var isAutoPassword = string.IsNullOrEmpty(request.Password);
        var passwordToHash = isAutoPassword ? "thehieu03" : request.Password!;

        var userEntity = UserEntity.Create(
            email,
            request.FullName.Trim(),
            email,
            _passwordHasher.HashPassword(passwordToHash),
            _user.Id ?? string.Empty,
            request.Avatar,
            forcePasswordChange: isAutoPassword);

        userEntity.VerifyStatus = VerifyStatus.Verified;

        await _unitOfWork.ExecuteTransactionAsync(async () =>
        {
            await _userRepository.Create(userEntity);
            var settingsRepo = _unitOfWork.GenericRepository<UserSettingEntity>();
            var settings = UserSettingEntity.Create(userEntity.Id, _user.Id ?? "system");
            await settingsRepo.AddAsync(settings);
            if (request.RoleIds.Count > 0)
            {
                await _roleRepository.AddUser(userEntity.Id, request.RoleIds);
                if (request.RoleIds.Contains((int)AssignedRole.HotelServiceProvider) && _hotelServiceProviderMapper is not null)
                {
                    await _hotelServiceProviderMapper.MapAndCreateAsync(userEntity, _user.Id ?? "system");
                }
            }
        });

        return userEntity.Id;
    }

    public async Task<ErrorOr<Success>> Update(UpdateUserRequest request)
    {
        var userEntity = await _userRepository.FindById(request.Id);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        string? oldPublicId = null;
        if (!string.IsNullOrEmpty(userEntity.AvatarUrl) && userEntity.AvatarUrl != request.Avatar)
        {
            oldPublicId = CloudinaryUtils.ExtractPublicIdFromUrl(userEntity.AvatarUrl);
        }

        userEntity.Update(request.FullName, request.Avatar, _user.Id ?? string.Empty);

        await _unitOfWork.ExecuteTransactionAsync(async () =>
        {
            _userRepository.Update(userEntity);
            await _roleRepository.DeleteUser(request.Id);
            if (request.RoleIds.Count > 0)
                await _roleRepository.AddUser(request.Id, request.RoleIds);
        });

        // Delete old avatar from Cloudinary if successfully updated in DB
        if (!string.IsNullOrEmpty(oldPublicId))
        {
            try
            {
                await _cloudinaryService.DeleteFilesAsync([oldPublicId]);
            }
            catch
            {
                // Non-critical, just log or ignore
            }
        }

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> UpdateStatus(Guid userId, UserStatus status)
    {
        var userEntity = await _userRepository.FindById(userId);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        userEntity.Status = status;
        userEntity.LastModifiedBy = _user.Id ?? "admin";
        userEntity.LastModifiedOnUtc = DateTimeOffset.UtcNow;
        _userRepository.Update(userEntity);
        await _unitOfWork.SaveChangeAsync();

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> ChangePassword(ChangePasswordRequest request)
    {
        var userEntity = await _userRepository.FindById(request.UserId);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var passwordToSet = string.IsNullOrEmpty(request.NewPassword)
            ? PasswordGenerator.Generate()
            : request.NewPassword;
        userEntity.ChangePassword(_passwordHasher.HashPassword(passwordToSet), _user.Id ?? string.Empty, forcePasswordChange: true);
        _userRepository.Update(userEntity);
        await _unitOfWork.SaveChangeAsync();

        return Result.Success;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        var userEntity = await _userRepository.FindById(id);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        // Dùng entity method để đảm bảo LastModifiedBy/LastModifiedOnUtc được set
        userEntity.SoftDelete(_user.Id ?? string.Empty);
        _userRepository.Update(userEntity);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<Success>> IsEmailUnique(string email)
    {
        var isUnique = await _userRepository.IsEmailUnique(email);
        if (!isUnique)
            return Error.Conflict(ErrorConstants.User.DuplicateEmailCode, ErrorConstants.User.DuplicateEmailDescription);
        return Result.Success;
    }
}
