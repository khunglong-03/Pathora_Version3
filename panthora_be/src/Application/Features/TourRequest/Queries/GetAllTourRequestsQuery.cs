using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourRequest.Queries;
public sealed record GetAllTourRequestsQuery(
    [property: JsonPropertyName("currentUserId")] string CurrentUserId,
    [property: JsonPropertyName("status")] TourRequestStatus? Status = null,
    [property: JsonPropertyName("fromDate")] DateTimeOffset? FromDate = null,
    [property: JsonPropertyName("toDate")] DateTimeOffset? ToDate = null,
    [property: JsonPropertyName("searchText")] string? SearchText = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourRequestVm>>>, ICacheable
{
    private string FromDateKey => FromDate?.ToString("O") ?? "null";
    private string ToDateKey => ToDate?.ToString("O") ?? "null";

    public string CacheKey =>
        $"{Common.CacheKey.TourRequest}:all:{CurrentUserId}:{Status}:{FromDateKey}:{ToDateKey}:{SearchText}:{PageNumber}:{PageSize}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetAllTourRequestsQueryValidator : AbstractValidator<GetAllTourRequestsQuery>
{
    public GetAllTourRequestsQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage(ValidationMessages.TourRequestPageNumberGreaterThanZero);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage(ValidationMessages.TourRequestPageSizeRange);

        RuleFor(x => x.ToDate)
            .GreaterThanOrEqualTo(x => x.FromDate!.Value)
            .When(x => x.FromDate.HasValue && x.ToDate.HasValue)
            .WithMessage(ValidationMessages.TourRequestToDateGreaterThanOrEqualFromDate);
    }
}

public sealed class GetAllTourRequestsQueryHandler(
    IUser user,
    IRoleRepository roleRepository,
    ITourRequestRepository tourRequestRepository)
    : IQueryHandler<GetAllTourRequestsQuery, ErrorOr<PaginatedList<TourRequestVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourRequestVm>>> Handle(GetAllTourRequestsQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var adminCheck = await EnsureManagerAsync(currentUserId, roleRepository);
        if (adminCheck.IsError)
        {
            return adminCheck.Errors;
        }

        var entities = await tourRequestRepository.GetAllAsync(
            request.Status,
            request.FromDate,
            request.ToDate,
            request.SearchText,
            request.PageNumber,
            request.PageSize,
            asNoTracking: true);

        var total = await tourRequestRepository.CountAllAsync(
            request.Status,
            request.FromDate,
            request.ToDate,
            request.SearchText);

        return new PaginatedList<TourRequestVm>(total, entities.Select(x => x.ToVm()).ToList(), request.PageNumber, request.PageSize);
    }

    private static async Task<ErrorOr<Success>> EnsureManagerAsync(Guid currentUserId, IRoleRepository roleRepository)
    {
        var rolesResult = await roleRepository.FindByUserId(currentUserId.ToString());
        if (rolesResult.IsError)
        {
            return rolesResult.Errors;
        }

        var isManager = rolesResult.Value.Any(role =>
            string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role.Name, "Manager", StringComparison.OrdinalIgnoreCase));

        return isManager
            ? Result.Success
            : Error.Forbidden(ErrorConstants.TourRequest.AdminOnlyCode, ErrorConstants.TourRequest.AdminOnlyDescription);
    }
}
