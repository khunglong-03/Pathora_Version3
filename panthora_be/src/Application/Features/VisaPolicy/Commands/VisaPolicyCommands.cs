using Application.Common;
using Application.Common.Constant;
using Application.Contracts.VisaPolicy;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Entities.Translations;
using ErrorOr;
using FluentValidation;

namespace Application.Features.VisaPolicy.Commands;

public sealed record CreateVisaPolicyCommand(
    string Region,
    int ProcessingDays,
    int BufferDays,
    bool FullPaymentRequired,
    Dictionary<string, VisaPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<Guid>>;

public sealed class CreateVisaPolicyCommandValidator : AbstractValidator<CreateVisaPolicyCommand>
{
    public CreateVisaPolicyCommandValidator()
    {
        RuleFor(x => x.Region)
            .NotEmpty().WithMessage(ValidationMessages.VisaPolicyRegionRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.VisaPolicyRegionMaxLength100);
        RuleFor(x => x.ProcessingDays)
            .GreaterThan(0).WithMessage(ValidationMessages.VisaPolicyProcessingDaysGreaterThanZero);
        RuleFor(x => x.BufferDays)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.VisaPolicyBufferDaysNonNegative);
    }
}

public sealed class CreateVisaPolicyCommandHandler(IVisaPolicyService visaPolicyService)
    : ICommandHandler<CreateVisaPolicyCommand, ErrorOr<Guid>>
{
    private readonly IVisaPolicyService _visaPolicyService = visaPolicyService;

    public async Task<ErrorOr<Guid>> Handle(CreateVisaPolicyCommand request, CancellationToken cancellationToken)
    {
        return await _visaPolicyService.Create(new CreateVisaPolicyRequest(
            request.Region,
            request.ProcessingDays,
            request.BufferDays,
            request.FullPaymentRequired,
            request.Translations
        ));
    }
}

public sealed record UpdateVisaPolicyCommand(
    Guid Id,
    string Region,
    int ProcessingDays,
    int BufferDays,
    bool FullPaymentRequired,
    bool IsActive,
    Dictionary<string, VisaPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<Success>>;

public sealed class UpdateVisaPolicyCommandValidator : AbstractValidator<UpdateVisaPolicyCommand>
{
    public UpdateVisaPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.VisaPolicyIdRequired);
        RuleFor(x => x.Region)
            .NotEmpty().WithMessage(ValidationMessages.VisaPolicyRegionRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.VisaPolicyRegionMaxLength100);
        RuleFor(x => x.ProcessingDays)
            .GreaterThan(0).WithMessage(ValidationMessages.VisaPolicyProcessingDaysGreaterThanZero);
        RuleFor(x => x.BufferDays)
            .GreaterThanOrEqualTo(0).WithMessage(ValidationMessages.VisaPolicyBufferDaysNonNegative);
    }
}

public sealed class UpdateVisaPolicyCommandHandler(IVisaPolicyService visaPolicyService)
    : ICommandHandler<UpdateVisaPolicyCommand, ErrorOr<Success>>
{
    private readonly IVisaPolicyService _visaPolicyService = visaPolicyService;

    public async Task<ErrorOr<Success>> Handle(UpdateVisaPolicyCommand request, CancellationToken cancellationToken)
    {
        return await _visaPolicyService.Update(new UpdateVisaPolicyRequest(
            request.Id,
            request.Region,
            request.ProcessingDays,
            request.BufferDays,
            request.FullPaymentRequired,
            request.IsActive,
            request.Translations
        ));
    }
}

public sealed record DeleteVisaPolicyCommand(Guid Id) : ICommand<ErrorOr<Success>>;

public sealed class DeleteVisaPolicyCommandValidator : AbstractValidator<DeleteVisaPolicyCommand>
{
    public DeleteVisaPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.VisaPolicyIdRequired);
    }
}

public sealed class DeleteVisaPolicyCommandHandler(IVisaPolicyService visaPolicyService)
    : ICommandHandler<DeleteVisaPolicyCommand, ErrorOr<Success>>
{
    private readonly IVisaPolicyService _visaPolicyService = visaPolicyService;

    public async Task<ErrorOr<Success>> Handle(DeleteVisaPolicyCommand request, CancellationToken cancellationToken)
    {
        return await _visaPolicyService.Delete(request.Id);
    }
}
