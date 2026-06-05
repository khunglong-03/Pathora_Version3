using Application.Dtos;
using Application.Features.TourGuideTask.Commands;
using Application.Features.TourGuideTask.Queries;
using Domain.Enums;
using ErrorOr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Api.Controllers;

[ApiController]
public class TourGuideTasksController : BaseApiController
{
    [Authorize(Roles = "Admin,Manager,TourOperator")]
    [HttpPost("api/tour-guide-tasks")]
    public async Task<IActionResult> Create([FromBody] CreateTourGuideTaskRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateTourGuideTaskCommand(
            request.TourInstanceId,
            request.Title,
            request.Description,
            request.IsMandatory,
            request.AssignedGuideId);

        var result = await Sender.Send(command, cancellationToken);
        return HandleCreated(result);
    }

    [Authorize(Roles = "Admin,Manager,TourOperator")]
    [HttpPut("api/tour-guide-tasks/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTourGuideTaskRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateTourGuideTaskCommand(
            id,
            request.Title,
            request.Description,
            request.IsMandatory,
            request.AssignedGuideId);

        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [Authorize(Roles = "Admin,Manager,TourOperator")]
    [HttpDelete("api/tour-guide-tasks/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteTourGuideTaskCommand(id);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("api/tour-instances/{tourInstanceId:guid}/guide-tasks")]
    public async Task<IActionResult> GetTasksByTourInstance(Guid tourInstanceId, CancellationToken cancellationToken)
    {
        var query = new GetTourGuideTasksQuery(tourInstanceId);
        var result = await Sender.Send(query, cancellationToken);
        return HandleResult(result);
    }

    [Authorize]
    [HttpPatch("api/tour-guide-tasks/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTourGuideTaskStatusRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateTourGuideTaskStatusCommand(
            id,
            request.Status,
            request.Notes,
            request.EvidenceImageUrls);

        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

public sealed record CreateTourGuideTaskRequest(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isMandatory")] bool IsMandatory,
    [property: JsonPropertyName("assignedGuideId")] string? AssignedGuideId
);

public sealed record UpdateTourGuideTaskRequest(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isMandatory")] bool IsMandatory,
    [property: JsonPropertyName("assignedGuideId")] string? AssignedGuideId
);

public sealed record UpdateTourGuideTaskStatusRequest(
    [property: JsonPropertyName("status")] TourGuideTaskStatus Status,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("evidenceImageUrls")] List<string>? EvidenceImageUrls
);
