namespace Application.Features.Admin.Queries.GetUserDetail;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class GetUserDetailQueryHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository)
    : IRequestHandler<GetUserDetailQuery, ErrorOr<UserDetailDto>>
{
    public async Task<ErrorOr<UserDetailDto>> Handle(
        GetUserDetailQuery request,
        CancellationToken cancellationToken)
    {
        var userEntity = await userRepository.FindById(request.Id);
        if (userEntity is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var rolesResult = await roleRepository.FindByUserId(request.Id.ToString());
        var roles = rolesResult.IsError
            ? new List<string>()
            : rolesResult.Value.Select(r => r.Name).ToList();

        return new UserDetailDto(
            userEntity.Id,
            userEntity.Username,
            userEntity.FullName,
            userEntity.Email,
            userEntity.PhoneNumber,
            userEntity.AvatarUrl,
            userEntity.Status,
            userEntity.VerifyStatus,
            roles,
            []);
    }
}