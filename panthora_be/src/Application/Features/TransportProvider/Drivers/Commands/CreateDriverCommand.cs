namespace Application.Features.TransportProvider.Drivers.Commands;

using BuildingBlocks.CORS;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;
using Application.Features.TransportProvider.Drivers.DTOs;
using ErrorOr;
using System.Text.Json.Serialization;
using FluentValidation;

public sealed record CreateDriverCommand(
    [property: JsonPropertyName("currentUserId")] Guid CurrentUserId,
    [property: JsonPropertyName("request")] CreateDriverRequestDto Request) : ICommand<ErrorOr<DriverResponseDto>>;

public static class DriverValidationMessages
{
    public const string FullNameRequired = "Họ tên không được để trống";
    public const string FullNameMaxLength = "Họ tên không được vượt quá 100 ký tự";
    public const string PhoneRequired = "Số điện thoại không được để trống";
    public const string PhoneInvalid = "Số điện thoại không hợp lệ (VD: 0912345678)";
    public const string PhonePattern = @"^(0[1-9][0-9]{8,9})$";
    public const string LicenseNumberRequired = "Số bằng lái không được để trống";
    public const string LicenseNumberMaxLength = "Số bằng lái không được vượt quá 50 ký tự";
    public const string LicenseTypeInvalid = "Loại bằng lái không hợp lệ";
    public const string NotesMaxLength = "Ghi chú không được vượt quá 1000 ký tự";
}

public sealed class CreateDriverCommandValidator : AbstractValidator<CreateDriverCommand>
{
    public CreateDriverCommandValidator()
    {
        RuleFor(x => x.Request.FullName)
            .NotEmpty().WithMessage(DriverValidationMessages.FullNameRequired)
            .MaximumLength(100).WithMessage(DriverValidationMessages.FullNameMaxLength);

        RuleFor(x => x.Request.PhoneNumber)
            .NotEmpty().WithMessage(DriverValidationMessages.PhoneRequired)
            .Matches(DriverValidationMessages.PhonePattern).WithMessage(DriverValidationMessages.PhoneInvalid);

        RuleFor(x => x.Request.LicenseNumber)
            .NotEmpty().WithMessage(DriverValidationMessages.LicenseNumberRequired)
            .MaximumLength(50).WithMessage(DriverValidationMessages.LicenseNumberMaxLength);

        RuleFor(x => x.Request.LicenseType)
            .InclusiveBetween(1, 6).WithMessage(DriverValidationMessages.LicenseTypeInvalid);
            
        RuleFor(x => x.Request.Notes)
            .MaximumLength(1000).WithMessage(DriverValidationMessages.NotesMaxLength);
    }
}

public sealed class CreateDriverCommandHandler(
        Domain.Common.Repositories.IDriverRepository driverRepository,
        Domain.UnitOfWork.IUnitOfWork unitOfWork)
    : MediatR.IRequestHandler<CreateDriverCommand, ErrorOr<DriverResponseDto>>
{
    public async Task<ErrorOr<DriverResponseDto>> Handle(
        CreateDriverCommand request,
        CancellationToken cancellationToken)
    {
        var driver = Domain.Entities.DriverEntity.Create(
            request.CurrentUserId,
            request.Request.FullName,
            request.Request.LicenseNumber,
            (Domain.Enums.DriverLicenseType)request.Request.LicenseType,
            request.Request.PhoneNumber,
            request.CurrentUserId.ToString(),
            request.Request.AvatarUrl,
            request.Request.Notes);

        await driverRepository.CreateAsync(driver, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);
        return MapToDto(driver);
    }

    private static DriverResponseDto MapToDto(Domain.Entities.DriverEntity d) => new(
        d.Id, d.FullName, d.LicenseNumber, d.LicenseType.ToString(),
        d.PhoneNumber, d.AvatarUrl, d.IsActive, d.Notes, d.CreatedOnUtc);
}
