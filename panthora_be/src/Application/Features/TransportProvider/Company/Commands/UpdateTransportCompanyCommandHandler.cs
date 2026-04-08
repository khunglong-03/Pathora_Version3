namespace Application.Features.TransportProvider.Company.Commands;

using Application.Common.Constant;
using Application.Features.TransportProvider.Company.DTOs;
using Domain.Common.Repositories;
using Domain.UnitOfWork;
using ErrorOr;
using MediatR;

public sealed class UpdateTransportCompanyCommandHandler(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateTransportCompanyCommand, ErrorOr<TransportCompanyProfileDto>>
{
    public async Task<ErrorOr<TransportCompanyProfileDto>> Handle(
        UpdateTransportCompanyCommand request,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.FindById(request.CurrentUserId);

        if (user is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        user.FullName = request.Request.CompanyName ?? user.FullName;
        user.Address = request.Request.Address ?? user.Address;
        user.PhoneNumber = request.Request.Phone ?? user.PhoneNumber;
        user.Email = request.Request.Email ?? user.Email;

        userRepository.Update(user);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return MapToDto(user);
    }

    private static TransportCompanyProfileDto MapToDto(Domain.Entities.UserEntity user) => new(
        user.Id,
        user.FullName ?? string.Empty,
        user.Address,
        user.PhoneNumber,
        user.Email);
}