using Application.Dtos;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class RoleProfile : Profile
{
    public RoleProfile()
    {
        CreateMap<RoleEntity, RoleDto>();
    }
}
