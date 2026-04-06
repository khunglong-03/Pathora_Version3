namespace Application.Features.Admin.Queries.GetAdminDashboardOverview;

using Application.Features.Admin.DTOs;
using global::Contracts.ModelResponse;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

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
