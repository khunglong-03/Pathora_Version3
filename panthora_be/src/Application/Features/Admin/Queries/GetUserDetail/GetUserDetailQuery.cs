namespace Application.Features.Admin.Queries.GetUserDetail;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record GetUserDetailQuery(Guid Id) : IQuery<ErrorOr<UserDetailDto>>;
