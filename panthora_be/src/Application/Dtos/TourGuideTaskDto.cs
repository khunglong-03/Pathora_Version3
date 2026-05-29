using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourGuideTaskDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("assignedGuideId")] string? AssignedGuideId,
    [property: JsonPropertyName("assignedGuideName")] string? AssignedGuideName,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isMandatory")] bool IsMandatory,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("completedAt")] DateTimeOffset? CompletedAt,
    [property: JsonPropertyName("completedBy")] string? CompletedBy,
    [property: JsonPropertyName("completedByName")] string? CompletedByName,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("evidenceImageUrls")] List<string> EvidenceImageUrls
);
