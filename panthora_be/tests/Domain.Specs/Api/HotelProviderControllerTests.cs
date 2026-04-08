using System.Security.Claims;
using System.Text.Json;
using Api.Controllers.HotelProvider;
using Application.Features.GuestArrival.DTOs;
using Application.Features.GuestArrival.Queries.GetGuestArrivalsByHotel;
using Application.Features.HotelServiceProvider.Accommodations.Commands;
using Application.Features.HotelServiceProvider.Accommodations.DTOs;
using Application.Features.RoomBlocking.DTOs;
using Application.Features.RoomBlocking.Queries.GetHotelRoomAvailability;
using BuildingBlocks.CORS;
using Contracts.ModelResponse;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

    [Fact]
    public async Task CreateAccommodation_WithStringRoomType_ReturnsAccommodationDtoWithStringRoomType()
    {
        var supplierId = Guid.CreateVersion7();
        var userId = Guid.CreateVersion7();
        var accommodationId = Guid.CreateVersion7();

        var supplier = SupplierEntity.Create("TH-" + Guid.NewGuid().ToString()[..8], SupplierType.Accommodation, "Test Hotel", "test-user", null, null, null, "address", null, userId);
        supplier.GetType().GetProperty("Id")!.SetValue(supplier, supplierId);

        var supplierRepository = Substitute.For<ISupplierRepository>();
        supplierRepository.FindByOwnerUserIdAsync(userId).Returns(supplier);

        var inventoryRepository = Substitute.For<IHotelRoomInventoryRepository>();
        inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, RoomType.Standard).Returns((HotelRoomInventoryEntity?)null);

        var user = Substitute.For<global::Contracts.Interfaces.IUser>();
        user.Id.Returns(userId.ToString());

        var unitOfWork = Substitute.For<IUnitOfWork>();

        var handler = new CreateAccommodationCommandHandler(inventoryRepository, supplierRepository, user, unitOfWork);

        var request = new CreateAccommodationCommand(
            new CreateAccommodationRequestDto(RoomType.Standard, 5, "Test Room", "123 Main St", null, null, null, null));

        var result = await handler.Handle(request, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value);
        Assert.Equal("Standard", result.Value.RoomType);
        Assert.Equal(5, result.Value.TotalRooms);
        Assert.Equal("Test Room", result.Value.Name);
    }

    [Fact]
    public async Task MapToDto_ReturnsEnumNameAsString()
    {
        var supplierId = Guid.CreateVersion7();
        var accommodationId = Guid.CreateVersion7();

        var entity = HotelRoomInventoryEntity.Create(
            supplierId, RoomType.Deluxe, 10, Guid.CreateVersion7().ToString(),
            "Deluxe Room", "456 Ocean Dr", null, null, null, null);

        var dto = MapToDtoForTest(entity);

        Assert.Equal("Deluxe", dto.RoomType);
        Assert.Equal(10, dto.TotalRooms);
        Assert.Equal("Deluxe Room", dto.Name);
    }

    private static AccommodationDto MapToDtoForTest(HotelRoomInventoryEntity e)
    {
        return new AccommodationDto(
            e.Id,
            e.SupplierId,
            e.RoomType.ToString(),
            e.TotalRooms,
            e.Name,
            e.Address,
            e.LocationArea?.ToString(),
            e.OperatingCountries,
            e.ImageUrls,
            e.Notes);
    }
}
