using Application.Contracts.VisaPolicy;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class VisaPolicyProfile : Profile
{
    public VisaPolicyProfile()
    {
        CreateMap<VisaPolicyEntity, VisaPolicyResponse>();
    }
}
