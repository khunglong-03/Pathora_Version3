namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

using Application.Common.Constant;
using FluentValidation;

public sealed class CreateStaffUnderManagerCommandValidator : AbstractValidator<CreateStaffUnderManagerCommand>
{
    public CreateStaffUnderManagerCommandValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty()
            .WithMessage(ValidationMessages.CommonIdRequired);

        RuleFor(x => x.Request.Email)
            .NotEmpty()
            .WithMessage(ValidationMessages.EmailRequired)
            .EmailAddress()
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.Request.FullName)
            .NotEmpty()
            .WithMessage(ValidationMessages.FullNameRequired);

        RuleFor(x => x.Request.StaffType)
            .InclusiveBetween(1, 2)
            .WithMessage(ValidationMessages.StaffTypeInvalid);

        RuleFor(x => x.Request.Password)
            .MinimumLength(6)
            .When(x => !string.IsNullOrEmpty(x.Request.Password))
            .WithMessage(ValidationMessages.PasswordMinLength);
    }
}
