using Application.Common;
using Application.Common.Constant;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

public sealed record SubmitPrivateTourForManagerReviewCommand(
    [property: JsonIgnore] Guid InstanceId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class SubmitPrivateTourForManagerReviewCommandValidator : AbstractValidator<SubmitPrivateTourForManagerReviewCommand>
{
    public SubmitPrivateTourForManagerReviewCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
    }
}

public sealed class SubmitPrivateTourForManagerReviewCommandHandler(
    ITourInstanceRepository repository,
    IUser user) : ICommandHandler<SubmitPrivateTourForManagerReviewCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(SubmitPrivateTourForManagerReviewCommand request, CancellationToken cancellationToken)
    {
        var instance = await repository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        try
        {
            instance.SubmitForManagerReview(user.Id ?? string.Empty);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("TourInstance.InvalidStatusTransition", ex.Message);
        }

        await repository.Update(instance, cancellationToken);
        return Result.Success;
    }
}

public sealed record ManagerApprovePrivateTourCommand(
    [property: JsonIgnore] Guid InstanceId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class ManagerApprovePrivateTourCommandValidator : AbstractValidator<ManagerApprovePrivateTourCommand>
{
    public ManagerApprovePrivateTourCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
    }
}

public sealed class ManagerApprovePrivateTourCommandHandler(
    ITourInstanceRepository repository,
    IUser user) : ICommandHandler<ManagerApprovePrivateTourCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ManagerApprovePrivateTourCommand request, CancellationToken cancellationToken)
    {
        var instance = await repository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        try
        {
            instance.ManagerApproveItinerary(user.Id ?? string.Empty);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("TourInstance.InvalidStatusTransition", ex.Message);
        }

        await repository.Update(instance, cancellationToken);
        return Result.Success;
    }
}

public sealed record ManagerRejectPrivateTourCommand(
    [property: JsonIgnore] Guid InstanceId,
    [property: JsonPropertyName("reason")] string Reason) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance, $"{CacheKey.TourInstance}:detail:{InstanceId}"];
}

public sealed class ManagerRejectPrivateTourCommandValidator : AbstractValidator<ManagerRejectPrivateTourCommand>
{
    public ManagerRejectPrivateTourCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Lý do từ chối không được để trống.")
            .MaximumLength(2000);
    }
}

public sealed class ManagerRejectPrivateTourCommandHandler(
    ITourInstanceRepository repository,
    IUser user) : ICommandHandler<ManagerRejectPrivateTourCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ManagerRejectPrivateTourCommand request, CancellationToken cancellationToken)
    {
        var instance = await repository.FindByIdWithInstanceDays(request.InstanceId);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        try
        {
            instance.ManagerRejectItinerary(request.Reason, user.Id ?? string.Empty);
        }
        catch (ArgumentException ex)
        {
            return Error.Validation("TourInstance.InvalidRejectReason", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("TourInstance.InvalidStatusTransition", ex.Message);
        }

        await repository.Update(instance, cancellationToken);
        return Result.Success;
    }
}
