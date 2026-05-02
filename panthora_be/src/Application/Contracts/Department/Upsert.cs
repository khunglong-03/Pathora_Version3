using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Department;

public sealed record UpdateDepartmentRequest(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName);

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

