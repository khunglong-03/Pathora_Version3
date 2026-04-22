namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using Application.Features.TransportProvider.Vehicles.Validators;
using FluentValidation;

public sealed class AdminUpdateVehicleCommandValidator : AbstractValidator<AdminUpdateVehicleCommand>
{
    public AdminUpdateVehicleCommandValidator()
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.Plate).NotEmpty();
        RuleFor(x => x.Request).SetValidator(new UpdateVehicleRequestDtoValidator());
    }
}
