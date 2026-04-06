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
            .ForCtorParam(
                nameof(TourDayActivityDto.linkToResources),
                opt => opt.MapFrom(src => src.ResourceLinks
                    .OrderBy(l => l.Order)
                    .Select(l => l.Url).ToList()))
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourInsuranceEntity, TourInsuranceDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourPlanLocationEntity, TourPlanLocationDto>();

        CreateMap<TourPlanRouteEntity, TourPlanRouteDto>()
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations));

        CreateMap<TourPlanAccommodationEntity, TourPlanAccommodationDto>();

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
            .ForMember(dest => dest.PricingPolicyId, opt => opt.MapFrom(src => src.PricingPolicyId))
            .ForMember(dest => dest.DepositPolicyId, opt => opt.MapFrom(src => src.DepositPolicyId))
            .ForMember(dest => dest.CancellationPolicyId, opt => opt.MapFrom(src => src.CancellationPolicyId))
            .ForMember(dest => dest.VisaPolicyId, opt => opt.MapFrom(src => src.VisaPolicyId))
            .ForMember(dest => dest.Translations, opt => opt.MapFrom(src => src.Translations))
            .ForMember(dest => dest.Services, opt => opt.MapFrom(src => src.Resources
                .Where(r => r.Type == TourResourceType.Service)
                .ToList()));
    }
}
