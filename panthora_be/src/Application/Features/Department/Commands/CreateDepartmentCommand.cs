using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using Application.Common.Constant;
using Application.Contracts.Department;
using Application.Services;
using System.Text.Json.Serialization;

namespace Application.Features.Department.Commands;

public sealed record CreateDepartmentCommand(
    [property: JsonPropertyName("departmentParentId")] Guid? DepartmentParentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Department];
}

public sealed class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.DepartmentName)
            .NotEmpty().WithMessage(ValidationMessages.DepartmentNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.DepartmentNameMaxLength100);
    }
}

public sealed class CreateDepartmentCommandHandler(IDepartmentService departmentService)
    : ICommandHandler<CreateDepartmentCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        return await departmentService.Create(new CreateDepartmentRequest(request.DepartmentParentId, request.DepartmentName));
    }
}



