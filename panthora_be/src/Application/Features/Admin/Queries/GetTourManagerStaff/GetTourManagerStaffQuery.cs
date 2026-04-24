namespace Application.Features.Admin.Queries.GetTourManagerStaff;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetTourManagerStaffQuery([property: JsonPropertyName("managerId")] Guid ManagerId)
    : IQuery<ErrorOr<TourManagerStaffDto>>;
