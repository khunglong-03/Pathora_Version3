using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Position;

public sealed record CreatePositionRequest(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("type")] int? Type
);

public sealed class CreatePositionRequestValidator : AbstractValidator<CreatePositionRequest>
{
    public CreatePositionRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.PositionNameRequired)
            .MaximumLength(255).WithMessage(ValidationMessages.PositionNameMaxLength255);
        RuleFor(x => x.Note)
            .MaximumLength(255).WithMessage(ValidationMessages.NoteMaxLength255);
    }
}

