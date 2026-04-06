namespace Application.Contracts.Department;

public sealed record CreateDepartmentRequest(Guid? DepartmentParentId, string DepartmentName);

