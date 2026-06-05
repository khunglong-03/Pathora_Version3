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

public sealed record CreateTourGuideTaskCommand(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("isMandatory")] bool IsMandatory,
    [property: JsonPropertyName("assignedGuideId")] string? AssignedGuideId) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class CreateTourGuideTaskCommandValidator : AbstractValidator<CreateTourGuideTaskCommand>
{
    public CreateTourGuideTaskCommandValidator()
    {
        RuleFor(x => x.TourInstanceId)
            .NotEmpty().WithMessage("TourInstanceId không được để trống.");

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề nhiệm vụ không được để trống.")
            .MaximumLength(250).WithMessage("Tiêu đề không được vượt quá 250 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Mô tả không được vượt quá 1000 ký tự.");
    }
}

public sealed class CreateTourGuideTaskCommandHandler(
    ITourGuideTaskRepository tourGuideTaskRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUser user) : ICommandHandler<CreateTourGuideTaskCommand, ErrorOr<Guid>>
{
    private readonly ITourGuideTaskRepository _tourGuideTaskRepository = tourGuideTaskRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly IUser _user = user;

    public async Task<ErrorOr<Guid>> Handle(CreateTourGuideTaskCommand request, CancellationToken cancellationToken)
    {
        var tourInstance = await _tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (tourInstance is null)
        {
            return Error.NotFound("TourInstance.NotFound", "Không tìm thấy lịch trình tour được yêu cầu.");
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
        var task = TourGuideTaskEntity.Create(
            request.TourInstanceId,
            request.Title,
            request.Description,
            request.IsMandatory,
            request.AssignedGuideId,
            performedBy);

        await _tourGuideTaskRepository.AddAsync(task, cancellationToken);

        return task.Id;
    }
}
