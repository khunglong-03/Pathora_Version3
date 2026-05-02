using Application.Common.Constant;
using Application.Features.TransportProvider.Vehicles.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Vehicles.Queries;

// ── Query record ──────────────────────────────────────────────────────────
public sealed record GetVehicleScheduleQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("from")] DateOnly From,
    [property: JsonPropertyName("to")] DateOnly To,
    [property: JsonPropertyName("vehicleId")] Guid? VehicleId)
    : IQuery<ErrorOr<List<VehicleScheduleItemDto>>>;

// ── Validator ─────────────────────────────────────────────────────────────
public sealed class GetVehicleScheduleQueryValidator
    : AbstractValidator<GetVehicleScheduleQuery>
{
    public GetVehicleScheduleQueryValidator()
    {
        RuleFor(q => q.From)
            .Must(d => d.Year >= 2020 && d.Year <= 2100)
            .WithMessage("Start date must be a valid year between 2020 and 2100.");

        RuleFor(q => q.To)
            .Must(d => d.Year >= 2020 && d.Year <= 2100)
            .WithMessage("End date must be a valid year between 2020 and 2100.");

        RuleFor(q => q)
            .Must(q => q.To >= q.From)
            .WithMessage("End date must be on or after start date.");

        RuleFor(q => q)
            .Must(q => q.To.DayNumber - q.From.DayNumber <= 366)
            .WithMessage("Date range cannot exceed one year.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────
public sealed class GetVehicleScheduleQueryHandler(
        ISupplierRepository supplierRepository,
        IVehicleBlockRepository vehicleBlockRepository,
        ILogger<GetVehicleScheduleQueryHandler> logger)
    : IRequestHandler<GetVehicleScheduleQuery, ErrorOr<List<VehicleScheduleItemDto>>>
{
    public async Task<ErrorOr<List<VehicleScheduleItemDto>>> Handle(
        GetVehicleScheduleQuery request,
        CancellationToken cancellationToken)
    {
        // (a) Resolve transport suppliers for the current user
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

        // (b) Query schedule data
        var projections = await vehicleBlockRepository.GetByOwnerAndDateRangeAsync(
            transportSupplierIds,
            request.CurrentUserId,
            request.From,
            request.To,
            request.VehicleId,
            cancellationToken);

        // (c) Map to DTO
        var dtos = projections
            .Select(p => new VehicleScheduleItemDto(
                p.BlockId,
                p.VehicleId,
                p.VehicleType.ToString(),
                p.VehicleBrand,
                p.VehicleModel,
                p.SeatCapacity,
                p.BlockedDate,
                p.HoldStatus.ToString(),
                p.TourInstanceName,
                p.TourInstanceCode,
                p.ActivityTitle,
                p.FromLocationName,
                p.ToLocationName))
            .ToList();

        logger.LogInformation(
            "VehicleSchedule for user {UserId}: {Count} blocks from {From} to {To}",
            request.CurrentUserId, dtos.Count, request.From, request.To);

        return dtos;
    }
}
