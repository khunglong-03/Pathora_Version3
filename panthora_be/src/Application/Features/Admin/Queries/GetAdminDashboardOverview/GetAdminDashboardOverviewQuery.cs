using Application.Features.Admin.DTOs;
using Application.Features.Admin.Queries.GetAdminDashboardOverview;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts.ModelResponse;

namespace Application.Features.Admin.Queries.GetAdminDashboardOverview;

public sealed record GetAdminDashboardOverviewQuery
    : IQuery<ErrorOr<AdminDashboardOverviewDto>>;


public sealed class GetAdminDashboardOverviewQueryHandler(
        IUserRepository userRepository,
        ITourManagerAssignmentRepository assignmentRepository,
        ISupplierRepository supplierRepository)
    : IRequestHandler<GetAdminDashboardOverviewQuery, ErrorOr<AdminDashboardOverviewDto>>
{
    public async Task<ErrorOr<AdminDashboardOverviewDto>> Handle(
        GetAdminDashboardOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var totalUsers = await userRepository.CountAll(null, (int?)null);
        var activeManagers = await userRepository.CountActiveManagersAsync(cancellationToken);
        var activeTransportProviders = await supplierRepository.CountActiveTransportProvidersAsync(cancellationToken);
        var activeHotelProviders = await supplierRepository.CountActiveHotelProvidersAsync(cancellationToken);
        var pendingTourRequests = await assignmentRepository.CountPendingTourRequestsAsync(cancellationToken);
        var recentActivity = await assignmentRepository.GetRecentActivityAsync(10, cancellationToken);

        return new AdminDashboardOverviewDto(
            totalUsers,
            activeManagers,
            activeTransportProviders,
            activeHotelProviders,
            pendingTourRequests,
            recentActivity);
    }
}


public sealed class GetAdminDashboardOverviewQueryValidator : AbstractValidator<GetAdminDashboardOverviewQuery>
{
    public GetAdminDashboardOverviewQueryValidator()
    {
        // No required fields for this query
    }
}