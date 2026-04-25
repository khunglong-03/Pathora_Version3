using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Position;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Position.Commands;
public sealed record CreatePositionCommand(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("type")] int? Type) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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



