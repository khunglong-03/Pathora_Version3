using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TourGuideTask.Commands;

public sealed record UpdateTourGuideTaskCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isMandatory")] bool IsMandatory,
    [property: JsonPropertyName("assignedGuideId")] string? AssignedGuideId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class UpdateTourGuideTaskCommandValidator : AbstractValidator<UpdateTourGuideTaskCommand>
{
    public UpdateTourGuideTaskCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("TaskId không được để trống.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề nhiệm vụ không được để trống.")
            .MaximumLength(250).WithMessage("Tiêu đề không được vượt quá 250 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả không được vượt quá 1000 ký tự.");
    }
}

public sealed class UpdateTourGuideTaskCommandHandler(
    ITourGuideTaskRepository tourGuideTaskRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUser user) : ICommandHandler<UpdateTourGuideTaskCommand, ErrorOr<Success>>
{
    private readonly ITourGuideTaskRepository _tourGuideTaskRepository = tourGuideTaskRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly IUser _user = user;

    public async Task<ErrorOr<Success>> Handle(UpdateTourGuideTaskCommand request, CancellationToken cancellationToken)
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

        // Validate that assigned guide is part of the tour instance guides
        if (!string.IsNullOrEmpty(request.AssignedGuideId) && Guid.TryParse(request.AssignedGuideId, out var guideGuid))
        {
            var isGuideAssigned = tourInstance.Managers.Any(m => 
                m.UserId == guideGuid && m.Role == TourInstanceManagerRole.Guide);
            
            if (!isGuideAssigned)
            {
                return Error.Validation("TourGuideTask.GuideNotAssigned", "Hướng dẫn viên được chọn chưa được gán cho chuyến đi này.");
            }
        }

        var performedBy = _user.Id ?? string.Empty;

        task.Title = request.Title;
        task.Description = request.Description;
        task.IsMandatory = request.IsMandatory;
        task.AssignedGuideId = request.AssignedGuideId;
        task.LastModifiedBy = performedBy;
        task.LastModifiedOnUtc = DateTimeOffset.UtcNow;

        _tourGuideTaskRepository.Update(task);

        return Result.Success;
    }
}
