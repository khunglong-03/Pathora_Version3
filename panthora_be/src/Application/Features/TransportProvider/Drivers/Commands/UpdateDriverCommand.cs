namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;
using FluentValidation;

public sealed record UpdateDriverCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("driverId")] Guid DriverId,
    [property: JsonPropertyName("request")] UpdateDriverRequestDto Request) : ICommand<ErrorOr<DriverResponseDto>>;

public sealed class UpdateDriverCommandValidator : AbstractValidator<UpdateDriverCommand>
{
    public UpdateDriverCommandValidator()
    {
        RuleFor(x => x.Request.FullName)
            .NotEmpty().WithMessage(DriverValidationMessages.FullNameRequired)
            .MaximumLength(100).WithMessage(DriverValidationMessages.FullNameMaxLength)
            .When(x => x.Request.FullName != null);

        RuleFor(x => x.Request.PhoneNumber)
            .NotEmpty().WithMessage(DriverValidationMessages.PhoneRequired)
            .Matches(DriverValidationMessages.PhonePattern).WithMessage(DriverValidationMessages.PhoneInvalid)
            .When(x => x.Request.PhoneNumber != null);

        RuleFor(x => x.Request.LicenseNumber)
            .NotEmpty().WithMessage(DriverValidationMessages.LicenseNumberRequired)
            .MaximumLength(50).WithMessage(DriverValidationMessages.LicenseNumberMaxLength)
            .When(x => x.Request.LicenseNumber != null);

        RuleFor(x => x.Request.LicenseType)
            .InclusiveBetween(1, 6).WithMessage(DriverValidationMessages.LicenseTypeInvalid)
            .When(x => x.Request.LicenseType.HasValue);
            
        RuleFor(x => x.Request.Notes)
            .MaximumLength(1000).WithMessage(DriverValidationMessages.NotesMaxLength)
            .When(x => x.Request.Notes != null);
    }
}

public sealed class UpdateDriverCommandHandler(
        Domain.Common.Repositories.IDriverRepository driverRepository)
    : MediatR.IRequestHandler<UpdateDriverCommand, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        UpdateDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = await driverRepository.FindByIdAndUserIdAsync(
            request.DriverId, request.CurrentUserId, cancellationToken);

        if (driver is null)
            return Error.NotFound(Application.Common.Constant.ErrorConstants.User.NotFoundCode, "Resource not found.");

        driver.Update(
            request.Request.FullName,
            request.Request.LicenseNumber,
            request.Request.LicenseType.HasValue ? (Domain.Enums.DriverLicenseType)request.Request.LicenseType.Value : null,
            request.Request.PhoneNumber,
            request.Request.AvatarUrl,
            request.Request.Notes,
            request.CurrentUserId.ToString());

        await driverRepository.UpdateAsync(driver, cancellationToken);
        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
