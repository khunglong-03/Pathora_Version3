using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.Department;

public sealed record UpdateDepartmentRequest(
    Guid DepartmentId,
    Guid? DepartmentParentId,
    string DepartmentName);

public sealed class UpdateDepartmentRequestValidator : AbstractValidator<UpdateDepartmentRequest>
{
    public UpdateDepartmentRequestValidator()
    {
        RuleFor(x => x.DepartmentName)
            .NotEmpty()
            .WithMessage(ValidationMessages.DepartmentNameRequired)
            .MaximumLength(100)
            .WithMessage(ValidationMessages.DepartmentNameMaxLength100);
    }
}

