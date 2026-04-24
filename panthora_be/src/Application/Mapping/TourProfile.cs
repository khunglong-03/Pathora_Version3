using Application.Dtos;
using Application.Features.Tour.Commands;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class TourProfile : Profile
{
    public TourProfile()
    {
        CreateMap<ImageEntity, ImageDto>();

        CreateMap<TourClassificationEntity, TourClassificationDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourDayEntity, TourDayDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourDayActivityEntity, TourDayActivityDto>()
            .ForCtorParam(nameof(TourDayActivityDto.FromLocationName), opt => opt.MapFrom(src => src.FromLocation != null ? src.FromLocation.LocationName : null))
            .ForCtorParam(nameof(TourDayActivityDto.ToLocationName), opt => opt.MapFrom(src => src.ToLocation != null ? src.ToLocation.LocationName : null))
            .ForCtorParam(nameof(TourDayActivityDto.TransportationType), opt => opt.MapFrom(src => src.TransportationType != null ? src.TransportationType.ToString() : null))
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourInsuranceEntity, TourInsuranceDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourPlanLocationEntity, TourPlanLocationDto>();



        CreateMap<TourPlanAccommodationEntity, TourPlanAccommodationDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourResourceEntity, TourResourceDto>();

        CreateMap<TourResourceEntity, ServiceDto>()
            .ForCtorParam(nameof(ServiceDto.Id), opt => opt.MapFrom(src => src.Id))
            .ForCtorParam(nameof(ServiceDto.ServiceName), opt => opt.MapFrom(src => src.Name))
            .ForCtorParam(nameof(ServiceDto.PricingType), opt => opt.MapFrom(src => src.PricingType))
            .ForCtorParam(nameof(ServiceDto.Price), opt => opt.MapFrom(src => src.Price))
            .ForCtorParam(nameof(ServiceDto.SalePrice), opt => opt.MapFrom(_ => (decimal?)null))
            .ForCtorParam(nameof(ServiceDto.Email), opt => opt.MapFrom(src => src.ContactEmail))
            .ForCtorParam(nameof(ServiceDto.ContactNumber), opt => opt.MapFrom(src => src.ContactPhone))
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourEntity, TourDto>()
            .ForMember(dest => dest.IsVisa, opt => opt.MapFrom(src => src.IsVisa))
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations))
            .ForMember(dest => dest.Services, opt => opt.MapFrom(src => src.Resources
                .Where(r => r.Type == TourResourceType.Service)
                .ToList()));
    }
}
