using Application.Dtos;
using AutoMapper;
using Domain.Entities;
using Domain.ValueObjects;

namespace Application.Mapping;

public sealed class TourInstanceProfile : Profile
{
    public TourInstanceProfile()
    {
        CreateMap<TourInstanceEntity, TourInstanceVm>()
            .ForCtorParam(nameof(TourInstanceVm.Status), opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam(nameof(TourInstanceVm.InstanceType), opt => opt.MapFrom(src => src.InstanceType.ToString()))
            .ForCtorParam(nameof(TourInstanceVm.TransportApprovalStatus), opt => opt.MapFrom(src => (int)src.TransportApprovalStatus));

        CreateMap<TourInstanceEntity, DuplicateInstanceSummaryDto>()
            .ForCtorParam(nameof(DuplicateInstanceSummaryDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(DuplicateInstanceSummaryDto.Title), opt => opt.MapFrom(src => src.Title))
            .ForCtorParam(nameof(DuplicateInstanceSummaryDto.StartDate), opt => opt.MapFrom(src => src.StartDate))
            .ForCtorParam(nameof(DuplicateInstanceSummaryDto.Status), opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<TourInstanceEntity, TourInstanceDto>()
            .ForCtorParam(nameof(TourInstanceDto.Status), opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam(nameof(TourInstanceDto.InstanceType), opt => opt.MapFrom(src => src.InstanceType.ToString()))
            .ForCtorParam(nameof(TourInstanceDto.Rating), opt => opt.MapFrom(_ => 0m))
            .ForCtorParam(nameof(TourInstanceDto.TotalBookings), opt => opt.MapFrom(_ => 0))
            .ForCtorParam(nameof(TourInstanceDto.Revenue), opt => opt.MapFrom(_ => 0m))
            .ForCtorParam(nameof(TourInstanceDto.Days), opt => opt.MapFrom(src => src.InstanceDays.OrderBy(d => d.InstanceDayNumber).ToList()))
            .ForCtorParam(nameof(TourInstanceDto.TransportProviderId), opt => opt.MapFrom(src => src.TransportProviderId))
            .ForCtorParam(nameof(TourInstanceDto.TransportProviderName), opt => opt.MapFrom(src => src.TransportProvider != null ? src.TransportProvider.Name : null));

        CreateMap<TourInstanceManagerEntity, TourInstanceManagerDto>()
            .ForCtorParam(nameof(TourInstanceManagerDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserId), opt => opt.MapFrom(src => src.UserId))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserName), opt => opt.MapFrom(src => src.User != null ? src.User.FullName : string.Empty))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserAvatar), opt => opt.MapFrom(src => src.User != null ? src.User.AvatarUrl : null))
            .ForCtorParam(nameof(TourInstanceManagerDto.Role), opt => opt.MapFrom(src => src.Role.ToString()));


        CreateMap<TourInstancePlanAccommodationEntity, TourInstancePlanAccommodationDto>()
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.RoomType), opt => opt.MapFrom(src => src.RoomType.ToString()))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.Quantity), opt => opt.MapFrom(src => src.Quantity))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.SupplierId), opt => opt.MapFrom(src => src.SupplierId))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.SupplierName), opt => opt.MapFrom(src => src.Supplier != null ? src.Supplier.Name : null))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.SupplierApprovalStatus), opt => opt.MapFrom(src => src.SupplierApprovalStatus.ToString()))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.SupplierApprovalNote), opt => opt.MapFrom(src => src.SupplierApprovalNote))
            .ForCtorParam(nameof(TourInstancePlanAccommodationDto.RoomBlocksTotal), opt => opt.MapFrom(src => src.TourInstanceDayActivity != null && src.TourInstanceDayActivity.RoomBlocks != null ? src.TourInstanceDayActivity.RoomBlocks.Sum(b => b.RoomCountBlocked) : 0));

        CreateMap<TourInstanceDayActivityEntity, TourInstanceDayActivityDto>()
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Order), opt => opt.MapFrom(src => src.Order))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.ActivityType), opt => opt.MapFrom(src => src.ActivityType.ToString()))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Title), opt => opt.MapFrom(src => src.Title))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Description), opt => opt.MapFrom(src => src.Description))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.StartTime), opt => opt.MapFrom(src => src.StartTime))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.EndTime), opt => opt.MapFrom(src => src.EndTime))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.IsOptional), opt => opt.MapFrom(src => src.IsOptional))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Note), opt => opt.MapFrom(src => src.Note))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Accommodation), opt => opt.MapFrom(src => src.Accommodation))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.TransportationType), opt => opt.MapFrom(src => src.TransportationType != null ? src.TransportationType.ToString() : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.TransportationName), opt => opt.MapFrom(src => src.TransportationName))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.FromLocation), opt => opt.MapFrom(src => src.FromLocation))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.ToLocation), opt => opt.MapFrom(src => src.ToLocation))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DurationMinutes), opt => opt.MapFrom(src => src.DurationMinutes))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DistanceKm), opt => opt.MapFrom(src => src.DistanceKm))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.Price), opt => opt.MapFrom(src => src.Price))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.BookingReference), opt => opt.MapFrom(src => src.BookingReference))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.VehicleId), opt => opt.MapFrom(src => src.VehicleId))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.VehiclePlate), opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.VehiclePlate : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.VehicleType), opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.VehicleType.ToString() : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.VehicleBrand), opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.Brand : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.VehicleModel), opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.Model : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.SeatCapacity), opt => opt.MapFrom(src => src.Vehicle != null ? src.Vehicle.SeatCapacity : (int?)null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DriverId), opt => opt.MapFrom(src => src.DriverId))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DriverName), opt => opt.MapFrom(src => src.Driver != null ? src.Driver.FullName : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DriverPhone), opt => opt.MapFrom(src => src.Driver != null ? src.Driver.PhoneNumber : null))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.PickupLocation), opt => opt.MapFrom(src => src.PickupLocation))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DropoffLocation), opt => opt.MapFrom(src => src.DropoffLocation))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.DepartureTime), opt => opt.MapFrom(src => src.DepartureTime))
            .ForCtorParam(nameof(TourInstanceDayActivityDto.ArrivalTime), opt => opt.MapFrom(src => src.ArrivalTime));

        CreateMap<TourInstanceDayEntity, TourInstanceDayDto>()
            .ForCtorParam(nameof(TourInstanceDayDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstanceDayDto.InstanceDayNumber), opt => opt.MapFrom(src => src.InstanceDayNumber))
            .ForCtorParam(nameof(TourInstanceDayDto.ActualDate), opt => opt.MapFrom(src => new DateTimeOffset(src.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)))
            .ForCtorParam(nameof(TourInstanceDayDto.Title), opt => opt.MapFrom(src => src.Title))
            .ForCtorParam(nameof(TourInstanceDayDto.Description), opt => opt.MapFrom(src => src.Description))
            .ForCtorParam(nameof(TourInstanceDayDto.StartTime), opt => opt.MapFrom(src => src.StartTime))
            .ForCtorParam(nameof(TourInstanceDayDto.EndTime), opt => opt.MapFrom(src => src.EndTime))
            .ForCtorParam(nameof(TourInstanceDayDto.Note), opt => opt.MapFrom(src => src.Note))
            .ForCtorParam(nameof(TourInstanceDayDto.Activities), opt => opt.MapFrom(src => src.Activities.OrderBy(a => a.Order).ToList()));
    }
}
