using Application.Common;
using Application.Contracts.Department;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Department.Commands;

public sealed record UpdateDepartmentCommand(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Department];
}

public sealed class UpdateDepartmentCommandHandler(IDepartmentService departmentService)
    : ICommandHandler<UpdateDepartmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        return await departmentService.Update(new UpdateDepartmentRequest(request.DepartmentId, request.DepartmentParentId, request.DepartmentName));
    }
}



