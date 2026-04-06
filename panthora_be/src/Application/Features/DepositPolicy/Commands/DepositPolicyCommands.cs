using Application.Common;
using Application.Common.Constant;
using Application.Contracts.DepositPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using ErrorOr;
using FluentValidation;

namespace Application.Features.DepositPolicy.Commands;

public sealed record CreateDepositPolicyCommand(
    int TourScope,
    int DepositType,
    decimal DepositValue,
    int MinDaysBeforeDeparture,
    Dictionary<string, DepositPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<Guid>>;

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
    Guid Id,
    int TourScope,
    int DepositType,
    decimal DepositValue,
    int MinDaysBeforeDeparture,
    bool IsActive,
    Dictionary<string, DepositPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<Success>>;

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

public sealed record DeleteDepositPolicyCommand(Guid Id) : ICommand<ErrorOr<Success>>;

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
