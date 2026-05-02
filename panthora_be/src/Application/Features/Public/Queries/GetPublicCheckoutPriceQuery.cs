using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Features.BookingManagement.Queries;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

/// <summary>
/// Anonymous checkout price preview for a <see cref="BookingType.PrivateCustomTourRequest"/> in <see cref="BookingStatus.Pending"/> with a private Draft instance.
/// </summary>
public sealed record GetPublicCheckoutPriceQuery(
    [property: JsonPropertyName("bookingId")] Guid BookingId)
    : IQuery<ErrorOr<CheckoutPriceResponse>>;

public sealed class GetPublicCheckoutPriceQueryHandler(
    ISender sender,
    IBookingRepository bookingRepository)
    : IQueryHandler<GetPublicCheckoutPriceQuery, ErrorOr<CheckoutPriceResponse>>
{
    public async Task<ErrorOr<CheckoutPriceResponse>> Handle(
        GetPublicCheckoutPriceQuery request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId, cancellationToken);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription);
        }

        if (booking.BookingType != BookingType.PrivateCustomTourRequest)
        {
            return Error.Forbidden(
                "PublicCheckout.NotPrivateCustom",
                "Booking is not eligible for public checkout preview.");
        }

        if (booking.Status != BookingStatus.Pending)
        {
            return Error.Forbidden(
                "PublicCheckout.NotPending",
                "Booking is not awaiting payment.");
        }

        var instance = booking.TourInstance;
        if (instance is null)
        {
            return Error.Failure("PublicCheckout.NoInstance", "Tour instance not found.");
        }

        if (instance.InstanceType != TourType.Private || instance.Status != TourInstanceStatus.Draft)
        {
            return Error.Forbidden(
                "PublicCheckout.InvalidInstance",
                "Tour instance is not a private draft.");
        }

        return await sender.Send(new GetCheckoutPriceQuery(request.BookingId), cancellationToken);
    }
}
