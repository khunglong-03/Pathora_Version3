using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;

namespace Application.Features.TourInstance.Commands;

public sealed record ProviderApproveTourInstanceCommand(
    Guid InstanceId,
    bool IsApproved,
    string? Note,
    string ProviderType) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ProviderApproveTourInstanceCommandValidator : AbstractValidator<ProviderApproveTourInstanceCommand>
{
    public ProviderApproveTourInstanceCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
        RuleFor(x => x.ProviderType).Must(x => x is "Hotel" or "Transport").WithMessage("ProviderType must be either 'Hotel' or 'Transport'.");
    }
}

public sealed class ProviderApproveTourInstanceCommandHandler(
    ITourInstanceService tourInstanceService,
    ITourInstancePlanRouteRepository routeRepository)
    : ICommandHandler<ProviderApproveTourInstanceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ProviderApproveTourInstanceCommand request, CancellationToken cancellationToken)
    {
        if (request.ProviderType == "Transport" && request.IsApproved)
        {
            var routes = await routeRepository.GetByTourInstanceIdAsync(request.InstanceId, cancellationToken);
            var unassignedRouteIds = routes
                .Where(route => route.VehicleId is null || route.DriverId is null)
                .Select(route => route.Id)
                .ToList();

            if (unassignedRouteIds.Count > 0)
            {
                return Error.Validation(
                    "TourInstance.RoutesNotAssigned",
                    $"Các tuyến vận chuyển chưa được gán xe/tài xế: {string.Join(", ", unassignedRouteIds)}");
            }
        }

        return await tourInstanceService.ProviderApprove(request.InstanceId, request.IsApproved, request.Note, request.ProviderType, cancellationToken);
    }
}
