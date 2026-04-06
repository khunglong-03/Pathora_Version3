namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record CreateStaffUnderManagerCommand(
    Guid ManagerId,
    CreateStaffUnderManagerRequest Request
) : ICommand<ErrorOr<StaffMemberDto>>;
