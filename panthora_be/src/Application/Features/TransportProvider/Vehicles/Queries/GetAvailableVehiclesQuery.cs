using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Vehicles.Queries;

// ── Query record ──────────────────────────────────────────────────────────
public sealed record GetAvailableVehiclesQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("date")] DateOnly Date,
    [property: JsonPropertyName("vehicleType")] VehicleType? VehicleType,
    [property: JsonPropertyName("excludeActivityId")] Guid? ExcludeActivityId)
    : IQuery<ErrorOr<List<AvailableVehicleDto>>>;

// ── Validator ─────────────────────────────────────────────────────────────
public sealed class GetAvailableVehiclesQueryValidator
    : AbstractValidator<GetAvailableVehiclesQuery>
{
    public GetAvailableVehiclesQueryValidator()
    {
        RuleFor(q => q.Date)
            .Must(d => d.Year >= 2020 && d.Year <= 2100)
            .WithMessage("Date must be a valid year between 2020 and 2100.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────
public sealed class GetAvailableVehiclesQueryHandler(
        ISupplierRepository supplierRepository,
        IVehicleRepository vehicleRepository,
        ITourInstanceRepository tourInstanceRepository,
        ILogger<GetAvailableVehiclesQueryHandler> logger)
    : IRequestHandler<GetAvailableVehiclesQuery, ErrorOr<List<AvailableVehicleDto>>>
{
    public async Task<ErrorOr<List<AvailableVehicleDto>>> Handle(
        GetAvailableVehiclesQuery request,
        CancellationToken cancellationToken)
    {
        // (a) Resolve all transport suppliers owned by the current user
        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(request.CurrentUserId, cancellationToken);
        var transportSupplierIds = suppliers
            .Where(s => !s.IsDeleted && s.IsActive)
            .Select(s => s.Id)
            .ToList();

        if (transportSupplierIds.Count == 0)
        {
            return Error.Validation(
                ErrorConstants.VehicleAvailability.NoSupplierCode,
                ErrorConstants.VehicleAvailability.NoSupplierDescription);
        }

        // (b) IDOR check: if excludeActivityId is provided, verify it belongs to one of the owned suppliers
        if (request.ExcludeActivityId.HasValue)
        {
            var activity = await tourInstanceRepository.FindActivityByIdAsync(
                request.ExcludeActivityId.Value, cancellationToken);

            if (activity is null || !activity.TransportSupplierId.HasValue
                || !transportSupplierIds.Contains(activity.TransportSupplierId.Value))
            {
                return Error.Forbidden(
                    ErrorConstants.VehicleAvailability.ActivityNotOwnedCode,
                    ErrorConstants.VehicleAvailability.ActivityNotOwnedDescription);
            }
        }

        // (c) Query repository with capacity-aware logic
        var results = await vehicleRepository.GetAvailableBySupplierAsync(
            transportSupplierIds,
            request.CurrentUserId,
            request.VehicleType,
            request.Date,
            request.ExcludeActivityId,
            cancellationToken);

        // (d) Map to DTO
        var dtos = results
            .Select(r => new AvailableVehicleDto(
                r.Vehicle.Id,
                r.Vehicle.VehicleType.ToString(),
                r.Vehicle.Brand,
                r.Vehicle.Model,
                r.Vehicle.SeatCapacity,
                r.Vehicle.Quantity,
                r.AvailableQuantity,
                r.Vehicle.Notes))
            .ToList();

        // (e) Structured log
        logger.LogInformation(
            "AvailableVehicles supplier {SupplierIds} on {Date}: {Count} results",
            string.Join(",", transportSupplierIds), request.Date, dtos.Count);

        return dtos;
    }
}
