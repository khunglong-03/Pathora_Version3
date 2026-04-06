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
            .ForCtorParam(nameof(TourInstanceVm.InstanceType), opt => opt.MapFrom(src => src.InstanceType.ToString()));

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
            .ForCtorParam(nameof(TourInstanceDto.Days), opt => opt.MapFrom(src => src.InstanceDays.OrderBy(d => d.InstanceDayNumber).ToList()));

        CreateMap<TourInstanceManagerEntity, TourInstanceManagerDto>()
            .ForCtorParam(nameof(TourInstanceManagerDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserId), opt => opt.MapFrom(src => src.UserId))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserName), opt => opt.MapFrom(src => src.User != null ? src.User.FullName : string.Empty))
            .ForCtorParam(nameof(TourInstanceManagerDto.UserAvatar), opt => opt.MapFrom(src => src.User != null ? src.User.AvatarUrl : null))
            .ForCtorParam(nameof(TourInstanceManagerDto.Role), opt => opt.MapFrom(src => src.Role.ToString()));


        CreateMap<TourInstanceDayEntity, TourInstanceDayDto>()
            .ForCtorParam(nameof(TourInstanceDayDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(TourInstanceDayDto.InstanceDayNumber), opt => opt.MapFrom(src => src.InstanceDayNumber))
            .ForCtorParam(nameof(TourInstanceDayDto.ActualDate), opt => opt.MapFrom(src => new DateTimeOffset(src.ActualDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)))
            .ForCtorParam(nameof(TourInstanceDayDto.Title), opt => opt.MapFrom(src => src.Title))
            .ForCtorParam(nameof(TourInstanceDayDto.Description), opt => opt.MapFrom(src => src.Description))
            .ForCtorParam(nameof(TourInstanceDayDto.StartTime), opt => opt.MapFrom(src => src.StartTime))
            .ForCtorParam(nameof(TourInstanceDayDto.EndTime), opt => opt.MapFrom(src => src.EndTime))
            .ForCtorParam(nameof(TourInstanceDayDto.Note), opt => opt.MapFrom(src => src.Note))
            .ForCtorParam(nameof(TourInstanceDayDto.TourDay), opt => opt.MapFrom(src => src.TourDay));
    }
}
