using Application.Dtos;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class DepartmentProfile : Profile
{
    public DepartmentProfile()
    {
        CreateMap<DepartmentEntity, DepartmentDto>();
    }
}
