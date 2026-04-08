namespace Application.Features.TransportProvider.Company.Queries;

using Application.Common.Constant;
using Application.Features.TransportProvider.Company.DTOs;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

public sealed class GetTransportCompanyQueryHandler(
        IUserRepository userRepository)
    : IRequestHandler<GetTransportCompanyQuery, ErrorOr<TransportCompanyProfileDto>>
{
    public async Task<ErrorOr<TransportCompanyProfileDto>> Handle(
        GetTransportCompanyQuery request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.CurrentUserId);

        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        return MapToDto(user);
    }

    private static TransportCompanyProfileDto MapToDto(Domain.Entities.UserEntity user) => new(
        user.Id,
        user.FullName ?? string.Empty,
        user.Address,
        user.PhoneNumber,
        user.Email);
}