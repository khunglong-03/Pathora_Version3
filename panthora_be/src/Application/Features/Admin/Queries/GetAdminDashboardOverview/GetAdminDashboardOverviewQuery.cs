namespace Application.Features.Admin.Queries.GetAdminDashboardOverview;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetAdminDashboardOverviewQuery
    : IQuery<ErrorOr<AdminDashboardOverviewDto>>;
