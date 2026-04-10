namespace Application.Features.HotelServiceProvider.Supplier.Queries;

using Application.Features.HotelServiceProvider.Supplier.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts.Interfaces;

public sealed record GetHotelSupplierForProviderQuery : IQuery<ErrorOr<HotelSupplierInfoDto>>;
