namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Application.Features.TransportProvider.Vehicles.Validators;
using Domain.Common.Repositories;
using FluentValidation;

public sealed class AdminCreateVehicleCommandValidator : AbstractValidator<AdminCreateVehicleCommand>
{
    public AdminCreateVehicleCommandValidator(IVehicleRepository vehicleRepository)
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.Request).SetValidator(new CreateVehicleRequestDtoValidator(vehicleRepository));
    }
}
