using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetProviderAssignedTourInstancesQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("approvalStatus")] ProviderApprovalStatus? ApprovalStatus = null) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>;

public sealed class GetProviderAssignedTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetProviderAssignedTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetProviderAssignedTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetProviderAssigned(request.PageNumber, request.PageSize, request.ApprovalStatus, cancellationToken);
    }
}
