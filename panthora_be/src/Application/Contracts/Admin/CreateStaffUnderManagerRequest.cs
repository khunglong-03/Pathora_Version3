using System.Text.Json.Serialization;

namespace Application.Contracts.Admin;

public sealed record CreateStaffUnderManagerRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("staffType")] int StaffType
);
