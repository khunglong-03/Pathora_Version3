namespace Application.Features.Admin.Commands.ManageTransportVehicles;

using FluentValidation;

public sealed class AdminDeleteVehicleCommandValidator : AbstractValidator<AdminDeleteVehicleCommand>
{
    public AdminDeleteVehicleCommandValidator()
    {
        RuleFor(x => x.AdminId).NotEmpty();
        RuleFor(x => x.ProviderUserId).NotEmpty();
        RuleFor(x => x.Plate).NotEmpty();
    }
}
