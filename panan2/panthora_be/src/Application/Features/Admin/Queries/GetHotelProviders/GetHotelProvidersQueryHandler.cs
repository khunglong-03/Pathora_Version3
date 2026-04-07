namespace Application.Features.Admin.Queries.GetHotelProviders;

using Application.Common.Interfaces;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using global::Contracts;
using Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

public sealed class GetHotelProvidersQueryHandler(
    AppDbContext context,
    IUserRepository userRepository)
    : IRequestHandler<GetHotelProvidersQuery, ErrorOr<PaginatedList<HotelProviderListItemDto>>>
{
    private const int HotelServiceProviderRoleId = (int)AssignedRole.HotelServiceProvider;

    public async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> Handle(
        GetHotelProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        // If filtering by continent, we need to find users via supplier → inventory chain first
        if (request.Continent.HasValue)
        {
            return await HandleWithContinentFilterAsync(request, pageNumber, pageSize, cancellationToken);
        }

        // Standard path: use repository (no continent filter)
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

        var userIds = users.Select(u => u.Id).ToList();

        // Compute accommodation data
        var accommodationData = await ComputeAccommodationDataAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = accommodationData.TryGetValue(user.Id, out var data);
            return new HotelProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : []);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }

    private async Task<ErrorOr<PaginatedList<HotelProviderListItemDto>>> HandleWithContinentFilterAsync(
        GetHotelProvidersQuery request,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        // Find users who have suppliers with inventory in the specified continent
        var userIdsWithInventory = await context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.OwnerUserId.HasValue)
            .Where(s => context.HotelRoomInventory
                .Any(h => h.SupplierId == s.Id && h.LocationArea == request.Continent.Value))
            .Select(s => s.OwnerUserId!.Value)
            .ToListAsync(cancellationToken);

        // Build user query filtered by those IDs
        var baseQuery = context.UserRoles
            .AsNoTracking()
            .Where(ur => ur.RoleId == HotelServiceProviderRoleId)
            .Join(context.Users.AsNoTracking().Where(u => !u.IsDeleted && userIdsWithInventory.Contains(u.Id)),
                ur => ur.UserId,
                u => u.Id,
                (ur, u) => u);

        // Apply search
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            baseQuery = baseQuery.Where(u =>
                (u.FullName != null && u.FullName.ToLower().Contains(search)) ||
                u.Email.ToLower().Contains(search) ||
                u.Username.ToLower().Contains(search));
        }

        // Apply status filter
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            baseQuery = baseQuery.Where(u => u.Status == UserStatus.Active);
        else if (!string.IsNullOrWhiteSpace(request.Status) && request.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            baseQuery = baseQuery.Where(u => u.Status == UserStatus.Inactive);

        var total = await baseQuery.CountAsync(cancellationToken);

        var userIds = await baseQuery
            .OrderByDescending(u => u.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var users = await context.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        // Compute accommodation data for filtered users (all continents)
        var accommodationData = await ComputeAccommodationDataAsync(userIds, cancellationToken);

        var items = users.Select(user =>
        {
            var hasData = accommodationData.TryGetValue(user.Id, out var data);
            return new HotelProviderListItemDto(
                user.Id,
                user.FullName ?? string.Empty,
                user.Email,
                user.PhoneNumber,
                user.AvatarUrl,
                user.Status,
                hasData ? data.Count : 0,
                hasData ? data.Continents.Select(c => c.ToString()).ToList() : []);
        }).ToList();

        return new PaginatedList<HotelProviderListItemDto>(total, items, pageNumber, pageSize);
    }

    private async Task<Dictionary<Guid, (int Count, List<Continent> Continents)>> ComputeAccommodationDataAsync(
        List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
            return [];

        var supplierIds = await context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.OwnerUserId.HasValue && userIds.Contains(s.OwnerUserId.Value))
            .Select(s => new { s.OwnerUserId, s.Id })
            .ToListAsync(cancellationToken);

        var supplierMap = supplierIds.ToDictionary(s => s.OwnerUserId!.Value, s => s.Id);

        var accommodationGroups = await context.HotelRoomInventory
            .AsNoTracking()
            .Where(h => supplierIds.Select(s => s.Id).Contains(h.SupplierId))
            .GroupBy(h => h.SupplierId)
            .Select(g => new
            {
                SupplierId = g.Key,
                Count = g.Count(),
                Continents = g.Where(h => h.LocationArea.HasValue).Select(h => h.LocationArea!.Value).Distinct().ToList()
            })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<Guid, (int Count, List<Continent> Continents)>();
        foreach (var group in accommodationGroups)
        {
            var ownerUserId = supplierIds.First(s => s.Id == group.SupplierId).OwnerUserId!.Value;
            result[ownerUserId] = (group.Count, group.Continents);
        }

        return result;
    }
}
