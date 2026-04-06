using Application.Common;
using Contracts;
using Contracts.Interfaces;
using Application.Contracts.Department;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Department.Queries;

public sealed record GetAllDepartmentsQuery() : IQuery<ErrorOr<PaginatedListWithPermissions<DepartmentVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Department}:all";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetAllDepartmentsQueryHandler(IDepartmentService departmentService)
    : IQueryHandler<GetAllDepartmentsQuery, ErrorOr<PaginatedListWithPermissions<DepartmentVm>>>
{
    public async Task<ErrorOr<PaginatedListWithPermissions<DepartmentVm>>> Handle(GetAllDepartmentsQuery request, CancellationToken cancellationToken)
    {
        return await departmentService.GetAll();
    }
}

