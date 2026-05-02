using System.Text.Json.Serialization;

namespace Application.Contracts.Department;

public sealed record DepartmentComboBoxVm(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("departmentName")] string DepartmentName);

