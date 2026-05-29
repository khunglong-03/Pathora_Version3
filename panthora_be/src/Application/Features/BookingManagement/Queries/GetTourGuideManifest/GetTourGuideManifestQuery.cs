using Application.Features.BookingManagement.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.Queries.GetTourGuideManifest;

public sealed record GetTourGuideManifestQuery(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("guideUserId")] Guid GuideUserId
) : IQuery<ErrorOr<TourGuideManifestDto>>;
