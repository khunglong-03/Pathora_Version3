using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.Position;

public sealed record CreatePositionRequest(
    string Name,
    int Level,
    string? Note,
    int? Type
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

