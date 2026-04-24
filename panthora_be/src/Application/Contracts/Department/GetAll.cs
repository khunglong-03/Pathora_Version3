using System.Text.Json.Serialization;

namespace Application.Contracts.Department;

public sealed record GetAllDepartmentRequest();

public sealed record DepartmentVm(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName,
    [property: JsonPropertyName("level")] int Level);

