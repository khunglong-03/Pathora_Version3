using Application.Features.Insurance.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;

namespace Application.Features.Insurance.Queries;

// GetAll
public sealed record GetAllInsurancesQuery : IQuery<ErrorOr<IReadOnlyList<InsuranceDto>>>;

public sealed class GetAllInsurancesQueryHandler(IInsuranceRepository insuranceRepository)
    : IRequestHandler<GetAllInsurancesQuery, ErrorOr<IReadOnlyList<InsuranceDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<InsuranceDto>>> Handle(GetAllInsurancesQuery request, CancellationToken cancellationToken)
    {
        var insurances = await insuranceRepository.GetAllAsync(cancellationToken);
        var result = insurances.Select(MapToDto).ToList();
        return result;
    }

    private static InsuranceDto MapToDto(Domain.Entities.TourInsuranceEntity e) => new(
        e.Id,
        e.InsuranceName,
        e.InsuranceType,
        e.InsuranceProvider,
        e.CoverageDescription,
        e.CoverageAmount,
        e.CoverageFee,
        e.IsOptional,
        e.Note,
        e.TourClassificationId,
        e.CreatedOnUtc,
        e.LastModifiedOnUtc
    );
}

// GetById
public sealed record GetInsuranceByIdQuery(Guid Id) : IQuery<ErrorOr<InsuranceDto?>>;

public sealed class GetInsuranceByIdQueryHandler(IInsuranceRepository insuranceRepository)
    : IRequestHandler<GetInsuranceByIdQuery, ErrorOr<InsuranceDto?>>
{
    public async Task<ErrorOr<InsuranceDto?>> Handle(GetInsuranceByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await insuranceRepository.GetByIdAsync(request.Id);
        if (entity is null || entity.IsDeleted)
            return (InsuranceDto?)null;

        return new InsuranceDto(
            entity.Id,
            entity.InsuranceName,
            entity.InsuranceType,
            entity.InsuranceProvider,
            entity.CoverageDescription,
            entity.CoverageAmount,
            entity.CoverageFee,
            entity.IsOptional,
            entity.Note,
            entity.TourClassificationId,
            entity.CreatedOnUtc,
            entity.LastModifiedOnUtc
        );
    }
}

// GetByClassification
public sealed record GetInsurancesByClassificationQuery(Guid ClassificationId) : IQuery<ErrorOr<IReadOnlyList<InsuranceDto>>>;

public sealed class GetInsurancesByClassificationQueryHandler(IInsuranceRepository insuranceRepository)
    : IRequestHandler<GetInsurancesByClassificationQuery, ErrorOr<IReadOnlyList<InsuranceDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<InsuranceDto>>> Handle(GetInsurancesByClassificationQuery request, CancellationToken cancellationToken)
    {
        var insurances = await insuranceRepository.GetByClassificationIdAsync(request.ClassificationId, cancellationToken);
        var result = insurances.Select(e => new InsuranceDto(
            e.Id,
            e.InsuranceName,
            e.InsuranceType,
            e.InsuranceProvider,
            e.CoverageDescription,
            e.CoverageAmount,
            e.CoverageFee,
            e.IsOptional,
            e.Note,
            e.TourClassificationId,
            e.CreatedOnUtc,
            e.LastModifiedOnUtc
        )).ToList();
        return result;
    }
}
