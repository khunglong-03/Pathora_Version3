namespace Application.Features.Admin.Commands.UpdateStaffUnderManager;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateStaffUnderManagerCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("staffId")] Guid StaffId,
    [property: JsonPropertyName("request")] UpdateStaffUnderManagerRequest Request) : ICommand<ErrorOr<StaffMemberDto>>;
