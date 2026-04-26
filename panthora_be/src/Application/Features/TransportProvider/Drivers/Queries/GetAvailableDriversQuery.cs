using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using Application.Features.TransportProvider.Drivers.DTOs;

namespace Application.Features.TransportProvider.Drivers.Queries;

// ── Query record ──────────────────────────────────────────────────────────
public sealed record GetAvailableDriversQuery(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("date")] DateOnly Date,
    [property: JsonPropertyName("excludeActivityId")] Guid? ExcludeActivityId)
    : IQuery<ErrorOr<List<DriverResponseDto>>>;

// ── Validator ─────────────────────────────────────────────────────────────
public sealed class GetAvailableDriversQueryValidator
    : AbstractValidator<GetAvailableDriversQuery>
{
    public GetAvailableDriversQueryValidator()
    {
        RuleFor(q => q.Date)
            .Must(d => d.Year >= 2020 && d.Year <= 2100)
            .WithMessage("Date must be a valid year between 2020 and 2100.");
    }
}

// ── Handler ───────────────────────────────────────────────────────────────
public sealed class GetAvailableDriversQueryHandler(
        ISupplierRepository supplierRepository,
        IDriverRepository driverRepository,
        ITourInstanceRepository tourInstanceRepository,
        ILogger<GetAvailableDriversQueryHandler> logger)
    : IRequestHandler<GetAvailableDriversQuery, ErrorOr<List<DriverResponseDto>>>
{
    public async Task<ErrorOr<List<DriverResponseDto>>> Handle(
        GetAvailableDriversQuery request,
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
                ErrorConstants.VehicleAvailability.NoSupplierCode, // We can reuse the same error for transport supplier missing
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

        // (c) Query repository with availability logic
        var results = await driverRepository.GetAvailableBySupplierAsync(
            transportSupplierIds,
            request.CurrentUserId,
            request.Date,
            request.ExcludeActivityId,
            cancellationToken);

        // (d) Map to DTO
        var dtos = results
            .Select(r => new DriverResponseDto(
                r.Id,
                r.FullName,
                r.LicenseNumber,
                r.LicenseType.ToString(),
                r.PhoneNumber,
                r.AvatarUrl,
                r.IsActive,
                r.Notes,
                r.CreatedOnUtc))
            .ToList();

        // (e) Structured log
        logger.LogInformation(
            "AvailableDrivers supplier {SupplierIds} on {Date}: {Count} results",
            string.Join(",", transportSupplierIds), request.Date, dtos.Count);

        return dtos;
    }
}
