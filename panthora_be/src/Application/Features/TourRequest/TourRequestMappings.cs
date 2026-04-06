using Application.Dtos;
using Domain.Entities;

namespace Application.Features.TourRequest;

internal static class TourRequestMappings
{
    internal static TourRequestVm ToVm(this TourRequestEntity entity)
    {
        return new TourRequestVm(
            entity.Id,
            entity.Destination,
            entity.DepartureDate,
            entity.ReturnDate ?? entity.DepartureDate,
            entity.NumberAdult,
            entity.Budget ?? 0,
            [.. entity.TravelInterests],
            entity.Status.ToString(),
            entity.CreatedOnUtc,
            entity.AdminNote,
            entity.ReviewedAt);
    }

    internal static TourRequestDetailDto ToDetailDto(this TourRequestEntity entity)
    {
        return new TourRequestDetailDto(
            entity.Id,
            entity.UserId,
            entity.CustomerName,
            entity.CustomerPhone,
            entity.CustomerEmail,
            entity.Destination,
            entity.DepartureDate,
            entity.ReturnDate ?? entity.DepartureDate,
            entity.NumberAdult,
            entity.Budget ?? 0,
            [.. entity.TravelInterests],
            entity.PreferredAccommodation,
            entity.TransportationPreference,
            entity.SpecialRequirements,
            entity.Status.ToString(),
            entity.AdminNote,
            entity.ReviewedBy,
            entity.ReviewedAt,
            entity.CreatedBy,
            entity.CreatedOnUtc,
            entity.LastModifiedBy,
            entity.LastModifiedOnUtc,
            entity.TourInstanceId);
    }
}
