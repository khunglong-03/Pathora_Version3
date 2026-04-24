namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateStaffUnderManagerCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("request")] CreateStaffUnderManagerRequest Request) : ICommand<ErrorOr<StaffMemberDto>>;
