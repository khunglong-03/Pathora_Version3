namespace Application.Contracts.Department;

public sealed record DepartmentComboBoxVm(
    Guid DepartmentId,
    Guid? DepartmentParentId,
    int Level,
    string DepartmentName
);

