using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Department.Commands;

public sealed record DeleteDepartmentCommand(Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Department];
}

public sealed class DeleteDepartmentCommandHandler(IDepartmentService departmentService)
    : ICommandHandler<DeleteDepartmentCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        return await departmentService.Delete(request.Id);
    }
}



