using Application.Dtos;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class PositionProfile : Profile
{
    public PositionProfile()
    {
        CreateMap<PositionEntity, PositionDto>();
    }
}
