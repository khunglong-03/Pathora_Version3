namespace Application.Features.Admin.Commands.ReassignStaff;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using ErrorOr;

public sealed record ReassignStaffCommand(
    Guid ManagerId,
    Guid StaffId,
    Guid TargetManagerId
) : ICommand<ErrorOr<Success>>;