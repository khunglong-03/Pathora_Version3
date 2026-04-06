using Application.Common;
using Application.Contracts.Department;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Department.Queries;

public sealed record GetDepartmentComboBoxQuery() : IQuery<ErrorOr<List<DepartmentComboBoxVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Department}:combobox";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetDepartmentComboBoxQueryHandler(IDepartmentService departmentService)
    : IQueryHandler<GetDepartmentComboBoxQuery, ErrorOr<List<DepartmentComboBoxVm>>>
{
    public async Task<ErrorOr<List<DepartmentComboBoxVm>>> Handle(GetDepartmentComboBoxQuery request, CancellationToken cancellationToken)
    {
        return await departmentService.GetAllForComboBox();
    }
}
