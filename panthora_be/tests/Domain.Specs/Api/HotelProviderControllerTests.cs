using System.Security.Claims;
using Api.Controllers.HotelProvider;
using Application.Features.GuestArrival.DTOs;
using Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;
using Application.Features.RoomBlocking.DTOs;
using Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;
using Domain.Common.Repositories;
using Microsoft.AspNetCore.Http;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class HotelProviderControllerTests
{
    [Fact]
    public async Task GetAvailability_WhenUserHasNoAccommodationSupplier_ShouldReturnEmptyList()
    {
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var userId = Guid.CreateVersion7();
        supplierRepository.FindByOwnerUserIdAsync(userId).Returns((Domain.Entities.SupplierEntity?)null);

        var httpContext = CreateHttpContext(userId, "/api/hotel-room-availability");
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<HotelRoomInventoryController, GetHotelRoomAvailabilityQuery, List<HotelRoomAvailabilityDto>>(
                new List<HotelRoomAvailabilityDto>(),
                "/api/hotel-room-availability",
                httpContext,
                supplierRepository);

        var actionResult = await controller.GetAvailability(DateOnly.FromDateTime(DateTime.UtcNow), DateOnly.FromDateTime(DateTime.UtcNow));

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/hotel-room-availability",
            expectedData: new List<HotelRoomAvailabilityDto>());

        Assert.Null(probe.CapturedRequest);
    }

    [Fact]
    public async Task GetByHotel_WhenUserHasNoAccommodationSupplier_ShouldReturnEmptyList()
    {
        var supplierRepository = Substitute.For<ISupplierRepository>();
        var userId = Guid.CreateVersion7();
        supplierRepository.FindByOwnerUserIdAsync(userId).Returns((Domain.Entities.SupplierEntity?)null);

        var httpContext = CreateHttpContext(userId, "/api/guest-arrivals");
        var (controller, probe) = ApiControllerTestHelper
            .BuildController<GuestArrivalController, GetGuestArrivalsByHotelQuery, List<GuestArrivalListDto>>(
                new List<GuestArrivalListDto>(),
                "/api/guest-arrivals",
                httpContext,
                supplierRepository);

        var actionResult = await controller.GetByHotel(null, null, null);

        ApiControllerTestHelper.AssertSuccessResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status200OK,
            expectedInstance: "/api/guest-arrivals",
            expectedData: new List<GuestArrivalListDto>());

        Assert.Null(probe.CapturedRequest);
    }

    private static HttpContext CreateHttpContext(Guid userId, string path)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = path;
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        ], "Bearer"));
        return httpContext;
    }
}
