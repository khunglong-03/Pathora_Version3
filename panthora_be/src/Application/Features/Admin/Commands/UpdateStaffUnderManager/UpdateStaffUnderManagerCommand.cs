namespace Application.Features.Admin.Commands.UpdateStaffUnderManager;

using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record UpdateStaffUnderManagerCommand(
    Guid ManagerId,
    Guid StaffId,
    UpdateStaffUnderManagerRequest Request
) : ICommand<ErrorOr<StaffMemberDto>>;
