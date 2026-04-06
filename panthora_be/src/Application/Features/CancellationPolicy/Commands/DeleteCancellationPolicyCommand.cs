using Application.Services;
using BuildingBlocks.CORS;
using Application.Common.Constant;
using ErrorOr;
using FluentValidation;

namespace Application.Features.CancellationPolicy.Commands;

public sealed record DeleteCancellationPolicyCommand(Guid Id) : ICommand<ErrorOr<Guid>>;

public sealed class DeleteCancellationPolicyCommandValidator : AbstractValidator<DeleteCancellationPolicyCommand>
{
    public DeleteCancellationPolicyCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage(ValidationMessages.CancellationPolicyIdRequired);
    }
}

public sealed class DeleteCancellationPolicyCommandHandler(ICancellationPolicyService service)
    : ICommandHandler<DeleteCancellationPolicyCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(
        DeleteCancellationPolicyCommand request,
        CancellationToken cancellationToken)
    {
        return await service.Delete(request.Id);
    }
}
