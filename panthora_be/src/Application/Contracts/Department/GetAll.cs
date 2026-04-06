namespace Application.Contracts.Department;

public sealed record GetAllDepartmentRequest();

public sealed record DepartmentVm(
    Guid DepartmentId,
    Guid? DepartmentParentId,
    string DepartmentName,
    int Level
);

