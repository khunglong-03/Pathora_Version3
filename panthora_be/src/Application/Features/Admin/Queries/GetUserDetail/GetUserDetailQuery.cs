namespace Application.Features.Admin.Queries.GetUserDetail;

using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record GetUserDetailQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<UserDetailDto>>;
