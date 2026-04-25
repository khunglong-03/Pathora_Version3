using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;
public sealed record GetMyAssignedTourInstancesQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>;
