using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.Identity.Commands;

public sealed record UpdateMyProfileCommand(UpdateMyProfileRequest Request)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class UpdateMyProfileCommandHandler(IIdentityService identityService)
    : ICommandHandler<UpdateMyProfileCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        return await identityService.UpdateMyProfile(request.Request);
    }
}
