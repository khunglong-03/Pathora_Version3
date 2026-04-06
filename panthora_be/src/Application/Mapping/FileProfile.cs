using Application.Dtos;
using AutoMapper;
using Domain.Entities;

namespace Application.Mapping;

public sealed class FileProfile : Profile
{
    public FileProfile()
    {
        CreateMap<FileMetadataEntity, FileMetadataDto>();
    }
}
