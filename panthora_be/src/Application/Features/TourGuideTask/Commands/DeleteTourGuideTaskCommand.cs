using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TourGuideTask.Commands;

public sealed record DeleteTourGuideTaskCommand(
    [property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class DeleteTourGuideTaskCommandValidator : AbstractValidator<DeleteTourGuideTaskCommand>
{
    public DeleteTourGuideTaskCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("TaskId không được để trống.");
    }
}

public sealed class DeleteTourGuideTaskCommandHandler(
    ITourGuideTaskRepository tourGuideTaskRepository) : ICommandHandler<DeleteTourGuideTaskCommand, ErrorOr<Success>>
{
    private readonly ITourGuideTaskRepository _tourGuideTaskRepository = tourGuideTaskRepository;

    public async Task<ErrorOr<Success>> Handle(DeleteTourGuideTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _tourGuideTaskRepository.GetByIdAsync(request.Id, cancellationToken);
        if (task is null)
        {
            return Error.NotFound("TourGuideTask.NotFound", "Không tìm thấy nhiệm vụ được yêu cầu.");
        }

        await _tourGuideTaskRepository.DeleteAsync(request.Id, cancellationToken);

        return Result.Success;
    }
}
