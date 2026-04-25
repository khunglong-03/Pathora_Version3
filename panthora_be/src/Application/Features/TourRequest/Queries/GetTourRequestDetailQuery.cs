using Application.Common.Constant;
using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourRequest.Queries;
public sealed record GetTourRequestDetailQuery(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("currentUserId")] string CurrentUserId) : IQuery<ErrorOr<TourRequestDetailDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourRequest}:detail:{CurrentUserId}:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTourRequestDetailQueryValidator : AbstractValidator<GetTourRequestDetailQuery>
{
    public GetTourRequestDetailQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.TourRequestIdRequired);
    }
}

public sealed class GetTourRequestDetailQueryHandler(
    IUser user,
    IRoleRepository roleRepository,
    ITourRequestRepository tourRequestRepository)
    : IQueryHandler<GetTourRequestDetailQuery, ErrorOr<TourRequestDetailDto>>
{
    public async Task<ErrorOr<TourRequestDetailDto>> Handle(GetTourRequestDetailQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(user.Id) || !Guid.TryParse(user.Id, out var currentUserId))
        {
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);
        }

        var requestEntity = await tourRequestRepository.GetByIdAsync(request.Id, asNoTracking: true);
        if (requestEntity is null)
        {
            return Error.NotFound(ErrorConstants.TourRequest.NotFoundCode, ErrorConstants.TourRequest.NotFoundDescription);
        }

        var adminCheck = await IsAdminAsync(currentUserId, roleRepository);
        if (adminCheck.IsError)
        {
            return adminCheck.Errors;
        }

        if (!adminCheck.Value && requestEntity.UserId != currentUserId)
        {
            return Error.Forbidden(ErrorConstants.TourRequest.ForbiddenCode, ErrorConstants.TourRequest.ForbiddenDescription);
        }

        return requestEntity.ToDetailDto();
    }

    private static async Task<ErrorOr<bool>> IsAdminAsync(Guid currentUserId, IRoleRepository roleRepository)
    {
        var rolesResult = await roleRepository.FindByUserId(currentUserId.ToString());
        if (rolesResult.IsError)
        {
            return rolesResult.Errors;
        }

        var isAdmin = rolesResult.Value.Any(role =>
            string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase));

        return isAdmin;
    }
}
