using Application.Common;
using Application.Common.Constant;
using Application.Contracts.User;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using Application.Services;

namespace Application.Features.User.Commands;

public sealed record CreateUserCommand(
    List<UserDepartmentInfo> Departments,
    List<int> RoleIds,
    string Email,
    string FullName,
    string Avatar) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage(ValidationMessages.FullNameAndLastNameRequired);
    }
}

public sealed class CreateUserCommandHandler(IUserService userService)
    : ICommandHandler<CreateUserCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        return await userService.Create(new CreateUserRequest(
            request.Departments, request.RoleIds, request.Email, request.FullName, request.Avatar));
    }
}
