namespace Application.Features.Admin.Queries.GetTourManagerStaff;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetTourManagerStaffQuery(Guid ManagerId)
    : IQuery<ErrorOr<TourManagerStaffDto>>;
