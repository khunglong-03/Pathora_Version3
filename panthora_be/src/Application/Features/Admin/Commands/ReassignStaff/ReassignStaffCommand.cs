namespace Application.Features.Admin.Commands.ReassignStaff;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record ReassignStaffCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("staffId")] Guid StaffId,
    [property: JsonPropertyName("targetManagerId")] Guid TargetManagerId) : ICommand<ErrorOr<Success>>;