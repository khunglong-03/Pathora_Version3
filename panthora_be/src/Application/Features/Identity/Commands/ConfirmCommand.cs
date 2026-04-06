using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Identity.Commands
{
    public sealed record ConfirmCommand(string code) : ICommand<ErrorOr<Success>>;
    public sealed class ConfirmCommandHandler(IIdentityService identityService)
    : ICommandHandler<ConfirmCommand, ErrorOr<Success>>
    {
        public async Task<ErrorOr<Success>> Handle(ConfirmCommand request, CancellationToken cancellationToken)
        {
            return await identityService.ConfirmRegister(new ConfirmRegisterRequest(request.code));
        }
    }
}
