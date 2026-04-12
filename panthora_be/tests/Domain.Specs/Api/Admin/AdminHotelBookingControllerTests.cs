using Api.Controllers.Admin;
using Application.Features.AdminHotelBookings.DTOs;
using Application.Features.AdminHotelBookings.Queries;
using Contracts;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Domain.Specs.Api.Admin;

public sealed class AdminHotelBookingControllerTests
{
    private const string BasePath = "/api/admin/hotel-bookings";

    [Fact]
    public async Task GetHotelBookings_ValidRequest_Returns200()
    {
        var accommodationDetails = new List<AdminAccommodationDetailDto>
        {
            new(
                DetailId: Guid.NewGuid(),
                BookingActivityReservationId: Guid.NewGuid(),
                AccommodationName: "Hotel ABC",
                RoomType: RoomType.Deluxe,
                RoomCount: 2,
                CheckInAt: DateTimeOffset.UtcNow.AddDays(1),
                CheckOutAt: DateTimeOffset.UtcNow.AddDays(3),
                BuyPrice: 150.00m,
                Status: ReservationStatus.Confirmed
            )
        };

        var bookingDto = new AdminHotelBookingDto(
            BookingId: Guid.NewGuid(),
            CustomerName: "Customer One",
            CustomerPhone: "0901234567",
            CustomerEmail: "customer1@example.com",
            TourName: "Sample Tour",
            DepartureDate: DateTimeOffset.UtcNow.AddDays(7),
            DurationDays: 3,
            Status: BookingStatus.Confirmed,
            AccommodationDetails: accommodationDetails
        );

        var bookings = new List<AdminHotelBookingDto> { bookingDto };
        var response = new PaginatedList<AdminHotelBookingDto>(bookings.Count, bookings, 1, 20);

        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminHotelBookingController, GetHotelBookingsForAdminQuery, PaginatedList<AdminHotelBookingDto>>(
                response,
                BasePath);

        var actionResult = await controller.GetHotelBookings(1, 20, null, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: response);
    }

    [Fact]
    public async Task GetHotelBookings_WithStatusFilter_PassesStatusToQuery()
    {
        var emptyResponse = new PaginatedList<AdminHotelBookingDto>(0, new List<AdminHotelBookingDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminHotelBookingController, GetHotelBookingsForAdminQuery, PaginatedList<AdminHotelBookingDto>>(
                emptyResponse,
                BasePath);

        await controller.GetHotelBookings(1, 20, "Confirmed", null, null, null);

        var captured = Assert.IsType<GetHotelBookingsForAdminQuery>(probe.CapturedRequest);
        Assert.Equal(BookingStatus.Confirmed, captured.Status);
    }

    [Fact]
    public async Task GetHotelBookings_WithDateRange_PassesDatesToQuery()
    {
        var emptyResponse = new PaginatedList<AdminHotelBookingDto>(0, new List<AdminHotelBookingDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminHotelBookingController, GetHotelBookingsForAdminQuery, PaginatedList<AdminHotelBookingDto>>(
                emptyResponse,
                BasePath);

        var fromDate = DateTimeOffset.UtcNow.AddDays(-7);
        var toDate = DateTimeOffset.UtcNow.AddDays(7);
        await controller.GetHotelBookings(1, 20, null, fromDate, toDate, null);

        var captured = Assert.IsType<GetHotelBookingsForAdminQuery>(probe.CapturedRequest);
        Assert.Equal(fromDate, captured.FromDate);
        Assert.Equal(toDate, captured.ToDate);
    }

    [Fact]
    public async Task GetHotelBookings_WithSearchText_PassesSearchToQuery()
    {
        var emptyResponse = new PaginatedList<AdminHotelBookingDto>(0, new List<AdminHotelBookingDto>(), 1, 20);
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<AdminHotelBookingController, GetHotelBookingsForAdminQuery, PaginatedList<AdminHotelBookingDto>>(
                emptyResponse,
                BasePath);

        await controller.GetHotelBookings(1, 20, null, null, null, "Customer A");

        var captured = Assert.IsType<GetHotelBookingsForAdminQuery>(probe.CapturedRequest);
        Assert.Equal("Customer A", captured.SearchText);
    }

    [Fact]
    public async Task GetHotelBookings_NoResults_Returns200WithEmptyArray()
    {
        var emptyResponse = new PaginatedList<AdminHotelBookingDto>(0, new List<AdminHotelBookingDto>(), 1, 20);
        var (controller, _) = ApiControllerTestHelper
            .BuildController<AdminHotelBookingController, GetHotelBookingsForAdminQuery, PaginatedList<AdminHotelBookingDto>>(
                emptyResponse,
                BasePath);

        var actionResult = await controller.GetHotelBookings(1, 20, null, null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: BasePath,
            expectedData: emptyResponse);
    }
}
