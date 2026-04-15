using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts;
using ErrorOr;

namespace Application.Features.TourInstance.Queries;

public sealed record GetMyAssignedTourInstancesQuery(
    int PageNumber = 1,
    int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>;
