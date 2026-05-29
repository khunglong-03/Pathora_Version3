using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TourGuideTask.Commands;

public sealed record UpdateTourGuideTaskStatusCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("status")] TourGuideTaskStatus Status,
    [property: JsonPropertyName("notes")] string? Notes = null,
    [property: JsonPropertyName("evidenceImageUrls")] List<string>? EvidenceImageUrls = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class UpdateTourGuideTaskStatusCommandValidator : AbstractValidator<UpdateTourGuideTaskStatusCommand>
{
    public UpdateTourGuideTaskStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("TaskId không được để trống.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái không hợp lệ.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Ghi chú không được vượt quá 1000 ký tự.");
    }
}

public sealed class UpdateTourGuideTaskStatusCommandHandler(
    ITourGuideTaskRepository tourGuideTaskRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUser user) : ICommandHandler<UpdateTourGuideTaskStatusCommand, ErrorOr<Success>>
{
    private readonly ITourGuideTaskRepository _tourGuideTaskRepository = tourGuideTaskRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly IUser _user = user;

    public async Task<ErrorOr<Success>> Handle(UpdateTourGuideTaskStatusCommand request, CancellationToken cancellationToken)
    {
        var task = await _tourGuideTaskRepository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            return Error.NotFound("TourGuideTask.NotFound", "Không tìm thấy nhiệm vụ được yêu cầu.");
        }

        var tourInstance = await _tourInstanceRepository.FindById(task.TourInstanceId, cancellationToken: cancellationToken);
        if (tourInstance is null)
        {
            return Error.NotFound("TourInstance.NotFound", "Không tìm thấy lịch trình tour của nhiệm vụ.");
        }

        // Authorize access
        var isAdminOrManager = _user.Roles.Any(r =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Operator", StringComparison.OrdinalIgnoreCase));

        var userId = _user.Id ?? string.Empty;

        if (!isAdminOrManager)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return Error.Unauthorized("TourGuideTask.Unauthorized", "Không thể xác định danh tính.");
            }

            // For Guides, they must be assigned to this tour instance
            var isGuideAssigned = tourInstance.Managers.Any(m => 
                m.UserId == userGuid && m.Role == TourInstanceManagerRole.Guide);

            if (!isGuideAssigned)
            {
                return Error.Forbidden("TourGuideTask.Forbidden", "Bạn không có quyền cập nhật trạng thái nhiệm vụ của chuyến đi này.");
            }

            // Optional: If task is specifically assigned to a guide, only that guide can complete it
            if (!string.IsNullOrEmpty(task.AssignedGuideId) && task.AssignedGuideId != userId)
            {
                return Error.Forbidden("TourGuideTask.NotYourTask", "Nhiệm vụ này đã được gán cho một hướng dẫn viên khác.");
            }
        }

        task.Status = request.Status;
        if (request.Status == TourGuideTaskStatus.Completed)
        {
            task.CompletedAt = DateTimeOffset.UtcNow;
            task.CompletedBy = userId;
            task.Notes = request.Notes;
            task.EvidenceImageUrls = request.EvidenceImageUrls ?? [];
        }
        else
        {
            task.CompletedAt = null;
            task.CompletedBy = null;
            task.Notes = null;
            task.EvidenceImageUrls = [];
        }

        task.LastModifiedBy = userId;
        task.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        _tourGuideTaskRepository.Update(task);

        return Result.Success;
    }
}
