using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using Application.Common.Constant;
using Application.Contracts.Position;
using Application.Services;

namespace Application.Features.Position.Commands;

public sealed record CreatePositionCommand(string Name, int Level, string? Note, int? Type) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Position];
}

public sealed class CreatePositionCommandValidator : AbstractValidator<CreatePositionCommand>
{
    public CreatePositionCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.PositionNameRequired)
            .MaximumLength(255).WithMessage(ValidationMessages.PositionNameMaxLength255);
    }
}

public sealed class CreatePositionCommandHandler(IPositionService positionService)
    : ICommandHandler<CreatePositionCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(CreatePositionCommand request, CancellationToken cancellationToken)
    {
        return await positionService.CreateAsync(new CreatePositionRequest(request.Name, request.Level, request.Note, request.Type));
    }
}



