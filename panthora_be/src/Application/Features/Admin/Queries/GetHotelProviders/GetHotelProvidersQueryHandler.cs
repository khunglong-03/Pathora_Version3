namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using MediatR;

public sealed class GetHotelProvidersQueryHandler(IUserRepository userRepository)
    : IRequestHandler<GetHotelProvidersQuery, ErrorOr<PaginatedList<HotelProviderListItemDto>>>
{
    private const int HotelServiceProviderRoleId = 7; // RoleId for "HotelServiceProvider"

    public async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> Handle(
        GetHotelProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var users = await userRepository.FindProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            pageNumber,
            pageSize,
            cancellationToken);

        var total = await userRepository.CountProvidersByRoleAsync(
            HotelServiceProviderRoleId,
            request.Search,
            request.Status,
            cancellationToken);

        var items = users.Select(user => new HotelProviderListItemDto(
            user.Id,
            user.FullName ?? string.Empty,
            user.Email,
            user.PhoneNumber,
            user.AvatarUrl,
            user.Status,
            0 // accommodationCount not available in data model
        )).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }
}