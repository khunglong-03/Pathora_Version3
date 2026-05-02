using System.Text.Json.Serialization;

namespace Application.Contracts.Department;

public sealed record CreateDepartmentRequest(
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName);
