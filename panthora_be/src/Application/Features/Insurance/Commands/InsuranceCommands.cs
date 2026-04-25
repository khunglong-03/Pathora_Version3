using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Text.Json.Serialization;

namespace Application.Features.Insurance.Commands;
// Create
public sealed record CreateInsuranceCommand(
    [property: JsonPropertyName("insuranceName")] string InsuranceName,
    [property: JsonPropertyName("insuranceType")] InsuranceType InsuranceType,
    [property: JsonPropertyName("insuranceProvider")] string InsuranceProvider,
    [property: JsonPropertyName("coverageDescription")] string CoverageDescription,
    [property: JsonPropertyName("coverageAmount")] decimal CoverageAmount,
    [property: JsonPropertyName("coverageFee")] decimal CoverageFee,
    [property: JsonPropertyName("tourClassificationId")] Guid TourClassificationId,
    [property: JsonPropertyName("isOptional")] bool IsOptional = false,
    [property: JsonPropertyName("note")] string? Note = null) : ICommand<ErrorOr<Guid>>;

public sealed class CreateInsuranceCommandValidator : AbstractValidator<CreateInsuranceCommand>
{
    public CreateInsuranceCommandValidator()
    {
        RuleFor(x => x.InsuranceName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.InsuranceProvider).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CoverageDescription).NotEmpty();
        RuleFor(x => x.CoverageAmount).GreaterThan(0);
        RuleFor(x => x.CoverageFee).GreaterThanOrEqualTo(0);
        RuleFor(x => x.TourClassificationId).NotEmpty();
    }
}

public sealed class CreateInsuranceCommandHandler(
    IInsuranceRepository insuranceRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateInsuranceCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(CreateInsuranceCommand request, CancellationToken cancellationToken)
    {
        var entity = TourInsuranceEntity.Create(
            request.InsuranceName,
            request.InsuranceType,
            request.InsuranceProvider,
            request.CoverageDescription,
            request.CoverageAmount,
            request.CoverageFee,
            "system",
            request.IsOptional,
            request.Note
        );
        entity.TourClassificationId = request.TourClassificationId;

        await insuranceRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync();
        return entity.Id;
    }
}

// Update
public sealed record UpdateInsuranceCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("insuranceName")] string InsuranceName,
    [property: JsonPropertyName("insuranceType")] InsuranceType InsuranceType,
    [property: JsonPropertyName("insuranceProvider")] string InsuranceProvider,
    [property: JsonPropertyName("coverageDescription")] string CoverageDescription,
    [property: JsonPropertyName("coverageAmount")] decimal CoverageAmount,
    [property: JsonPropertyName("coverageFee")] decimal CoverageFee,
    [property: JsonPropertyName("isOptional")] bool IsOptional = false,
    [property: JsonPropertyName("note")] string? Note = null) : ICommand<ErrorOr<Success>>;

public sealed class UpdateInsuranceCommandValidator : AbstractValidator<UpdateInsuranceCommand>
{
    public UpdateInsuranceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.InsuranceName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.InsuranceProvider).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CoverageDescription).NotEmpty();
        RuleFor(x => x.CoverageAmount).GreaterThan(0);
        RuleFor(x => x.CoverageFee).GreaterThanOrEqualTo(0);
    }
}

public sealed class UpdateInsuranceCommandHandler(
    IInsuranceRepository insuranceRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateInsuranceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateInsuranceCommand request, CancellationToken cancellationToken)
    {
        var entity = await insuranceRepository.GetByIdAsync(request.Id);
        if (entity is null || entity.IsDeleted)
            return Error.NotFound("Insurance not found.");

        entity.Update(
            request.InsuranceName,
            request.InsuranceType,
            request.InsuranceProvider,
            request.CoverageDescription,
            request.CoverageAmount,
            request.CoverageFee,
            "system",
            request.IsOptional,
            request.Note
        );

        insuranceRepository.Update(entity);
        await unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}

// Delete (soft delete)
public sealed record DeleteInsuranceCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;

public sealed class DeleteInsuranceCommandValidator : AbstractValidator<DeleteInsuranceCommand>
{
    public DeleteInsuranceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public sealed class DeleteInsuranceCommandHandler(
    IInsuranceRepository insuranceRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteInsuranceCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteInsuranceCommand request, CancellationToken cancellationToken)
    {
        var entity = await insuranceRepository.GetByIdAsync(request.Id);
        if (entity is null || entity.IsDeleted)
            return Error.NotFound("Insurance not found.");

        entity.SoftDelete("system");
        insuranceRepository.Update(entity);
        await unitOfWork.SaveChangeAsync();
        return Result.Success;
    }
}
