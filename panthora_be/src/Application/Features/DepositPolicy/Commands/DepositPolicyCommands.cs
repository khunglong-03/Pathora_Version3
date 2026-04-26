using Application.Common.Constant;
using Application.Common;
using Application.Contracts.DepositPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.DepositPolicy.Commands;

public sealed record CreateDepositPolicyCommand(
    [property: JsonPropertyName("tourScope")] int TourScope,
    [property: JsonPropertyName("depositType")] int DepositType,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture,
    [property: JsonPropertyName("translations")] Dictionary<string, DepositPolicyTranslationData>? Translations = null) : ICommand<ErrorOr<Guid>>;

public sealed class CreateDepositPolicyCommandValidator : AbstractValidator<CreateDepositPolicyCommand>
{
    public CreateDepositPolicyCommandValidator()
    {
        RuleFor(x => x.TourScope)
            .InclusiveBetween(1, 2).WithMessage(ValidationMessages.DepositPolicyScopeRange);

        RuleFor(x => x.DepositType)
            .InclusiveBetween(1, 2).WithMessage(ValidationMessages.DepositPolicyTypeRange);

        RuleFor(x => x.DepositValue)
            .GreaterThan(0).WithMessage(ValidationMessages.DepositPolicyValueGreaterThanZero);

        RuleFor(x => x.MinDaysBeforeDeparture)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.DepositPolicyMinDaysNonNegative);
    }
}

public sealed class CreateDepositPolicyCommandHandler(IDepositPolicyService depositPolicyService)
    : ICommandHandler<CreateDepositPolicyCommand, ErrorOr<Guid>>
{
    private readonly IDepositPolicyService _depositPolicyService = depositPolicyService;

    public async Task<ErrorOr<Guid>> Handle(CreateDepositPolicyCommand request, CancellationToken cancellationToken)
    {
        var result = await _depositPolicyService.Create(new CreateDepositPolicyRequest(
            request.TourScope,
            request.DepositType,
            request.DepositValue,
            request.MinDaysBeforeDeparture,
            request.Translations
        ));
        return result;
    }
}

public sealed record UpdateDepositPolicyCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourScope")] int TourScope,
    [property: JsonPropertyName("depositType")] int DepositType,
    [property: JsonPropertyName("depositValue")] decimal DepositValue,
    [property: JsonPropertyName("minDaysBeforeDeparture")] int MinDaysBeforeDeparture,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("translations")] Dictionary<string, DepositPolicyTranslationData>? Translations = null) : ICommand<ErrorOr<Success>>;

public sealed class UpdateDepositPolicyCommandValidator : AbstractValidator<UpdateDepositPolicyCommand>
{
    public UpdateDepositPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.DepositPolicyIdRequired);

        RuleFor(x => x.TourScope)
            .InclusiveBetween(1, 2).WithMessage(ValidationMessages.DepositPolicyScopeRange);

        RuleFor(x => x.DepositType)
            .InclusiveBetween(1, 2).WithMessage(ValidationMessages.DepositPolicyTypeRange);

        RuleFor(x => x.DepositValue)
            .GreaterThan(0).WithMessage(ValidationMessages.DepositPolicyValueGreaterThanZero);

        RuleFor(x => x.MinDaysBeforeDeparture)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.DepositPolicyMinDaysNonNegative);
    }
}

public sealed class UpdateDepositPolicyCommandHandler(IDepositPolicyService depositPolicyService)
    : ICommandHandler<UpdateDepositPolicyCommand, ErrorOr<Success>>
{
    private readonly IDepositPolicyService _depositPolicyService = depositPolicyService;

    public async Task<ErrorOr<Success>> Handle(UpdateDepositPolicyCommand request, CancellationToken cancellationToken)
    {
        var result = await _depositPolicyService.Update(new UpdateDepositPolicyRequest(
            request.Id,
            request.TourScope,
            request.DepositType,
            request.DepositValue,
            request.MinDaysBeforeDeparture,
            request.IsActive,
            request.Translations
        ));
        return result;
    }
}

public sealed record DeleteDepositPolicyCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;

public sealed class DeleteDepositPolicyCommandValidator : AbstractValidator<DeleteDepositPolicyCommand>
{
    public DeleteDepositPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.DepositPolicyIdRequired);
    }
}

public sealed class DeleteDepositPolicyCommandHandler(IDepositPolicyService depositPolicyService)
    : ICommandHandler<DeleteDepositPolicyCommand, ErrorOr<Success>>
{
    private readonly IDepositPolicyService _depositPolicyService = depositPolicyService;

    public async Task<ErrorOr<Success>> Handle(DeleteDepositPolicyCommand request, CancellationToken cancellationToken)
    {
        return await _depositPolicyService.Delete(request.Id);
    }
}
