using Contracts;
using Contracts.Interfaces;
using Application.Common.Constant;
using Application.Contracts.Department;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;

namespace Application.Services;

public interface IDepartmentService
{
    Task<ErrorOr<PaginatedListWithPermissions<DepartmentVm>>> GetAll();
    Task<ErrorOr<Guid>> Create(CreateDepartmentRequest request);
    Task<ErrorOr<Success>> Update(UpdateDepartmentRequest request);
    Task<ErrorOr<Success>> Delete(Guid id);
    Task<ErrorOr<List<DepartmentComboBoxVm>>> GetAllForComboBox();
}

public class DepartmentService(
    IUser user,
    IRoleService roleService,
    IDepartmentRepository departmentRepository,
    IUnitOfWork unitOfWork)
    : IDepartmentService
{
    private readonly IUser _user = user;
    private readonly IRoleService _roleService = roleService;
    private readonly IDepartmentRepository _departmentRepository = departmentRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;

    public async Task<ErrorOr<Guid>> Create(CreateDepartmentRequest request)
    {
        var level = 1;
        if (request.DepartmentParentId.HasValue)
        {
            var parent = await _departmentRepository.GetByIdAsync(request.DepartmentParentId.Value);
            if (parent is not null)
                level = parent.Level + 1;
        }

        var department = DepartmentEntity.Create(request.DepartmentName, level, _user.Id ?? string.Empty, request.DepartmentParentId);

        await _departmentRepository.AddAsync(department);
        await _unitOfWork.SaveChangeAsync();
        return department.Id;
    }

    public async Task<ErrorOr<Success>> Delete(Guid id)
    {
        await _departmentRepository.DeleteAsync(id);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }

    public async Task<ErrorOr<PaginatedListWithPermissions<DepartmentVm>>> GetAll()
    {
        var departments = await _departmentRepository.GetListAsync(d =>
            !(bool)((object)d.GetType().GetProperty("IsDeleted")!.GetValue(d)! ?? false));

        // Use a simpler approach - get all and filter
        var allDepartments = await _departmentRepository.GetAllAsync();
        var activeDepartments = allDepartments
            .Where(d => !d.IsDeleted)
            .Select(d => new DepartmentVm(d.Id, d.ParentId, d.Name, d.Level))
            .ToList();

        return new PaginatedListWithPermissions<DepartmentVm>(
            activeDepartments.Count, activeDepartments, new Dictionary<string, bool>());
    }

    public async Task<ErrorOr<List<DepartmentComboBoxVm>>> GetAllForComboBox()
    {
        var allDepartments = await _departmentRepository.GetAllAsync();
        return allDepartments
            .Where(d => !d.IsDeleted)
            .Select(d => new DepartmentComboBoxVm(d.Id, d.ParentId, d.Level, d.Name))
            .ToList();
    }

    public async Task<ErrorOr<Success>> Update(UpdateDepartmentRequest request)
    {
        var department = await _departmentRepository.GetByIdAsync(request.DepartmentId);
        if (department is null)
            return Error.NotFound(ErrorConstants.Department.NotFoundCode, ErrorConstants.Department.NotFoundDescription);

        var level = 1;
        if (request.DepartmentParentId.HasValue)
        {
            var parent = await _departmentRepository.GetByIdAsync(request.DepartmentParentId.Value);
            if (parent is not null)
                level = parent.Level + 1;
        }

        department.Update(request.DepartmentName, level, _user.Id ?? string.Empty, request.DepartmentParentId);
        _departmentRepository.Update(department);
        await _unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}
