using Application.Features.VisaApplication.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.VisaApplication.Queries;

// GetAll
public sealed record GetAllVisaApplicationsQuery : IQuery<ErrorOr<IReadOnlyList<VisaApplicationDto>>>;

public sealed class GetAllVisaApplicationsQueryHandler(IVisaApplicationRepository repository)
    : IRequestHandler<GetAllVisaApplicationsQuery, ErrorOr<IReadOnlyList<VisaApplicationDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<VisaApplicationDto>>> Handle(GetAllVisaApplicationsQuery request, CancellationToken cancellationToken)
    {
        // Use base repository GetAllAsync for simple listing
        var entities = await repository.GetAllAsync(cancellationToken);
        var result = entities.Select(e => new VisaApplicationDto(
            e.Id,
            e.BookingParticipantId,
            e.BookingParticipant?.FullName,
            e.PassportId,
            e.Passport?.PassportNumber,
            e.DestinationCountry,
            e.Status,
            e.MinReturnDate,
            e.RefusalReason,
            e.VisaFileUrl,
            e.CreatedOnUtc,
            e.LastModifiedOnUtc
        )).ToList();
        return result;
    }
}

// GetById
public sealed record GetVisaApplicationByIdQuery(Guid Id) : IQuery<ErrorOr<VisaApplicationDto?>>;

public sealed class GetVisaApplicationByIdQueryHandler(IVisaApplicationRepository repository)
    : IRequestHandler<GetVisaApplicationByIdQuery, ErrorOr<VisaApplicationDto?>>
{
    public async Task<ErrorOr<VisaApplicationDto?>> Handle(GetVisaApplicationByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await repository.GetByIdAsync(request.Id);
        if (entity is null)
            return (VisaApplicationDto?)null;

        return new VisaApplicationDto(
            entity.Id,
            entity.BookingParticipantId,
            entity.BookingParticipant?.FullName,
            entity.PassportId,
            entity.Passport?.PassportNumber,
            entity.DestinationCountry,
            entity.Status,
            entity.MinReturnDate,
            entity.RefusalReason,
            entity.VisaFileUrl,
            entity.CreatedOnUtc,
            entity.LastModifiedOnUtc
        );
    }
}

// GetByBookingParticipant
public sealed record GetVisaApplicationsByParticipantQuery(Guid BookingParticipantId) : IQuery<ErrorOr<IReadOnlyList<VisaApplicationDto>>>;

public sealed class GetVisaApplicationsByParticipantQueryHandler(IVisaApplicationRepository repository)
    : IRequestHandler<GetVisaApplicationsByParticipantQuery, ErrorOr<IReadOnlyList<VisaApplicationDto>>>
{
    public async Task<ErrorOr<IReadOnlyList<VisaApplicationDto>>> Handle(GetVisaApplicationsByParticipantQuery request, CancellationToken cancellationToken)
    {
        var entities = await repository.GetByBookingParticipantIdAsync(request.BookingParticipantId, cancellationToken);
        var result = entities.Select(e => new VisaApplicationDto(
            e.Id,
            e.BookingParticipantId,
            e.BookingParticipant?.FullName,
            e.PassportId,
            e.Passport?.PassportNumber,
            e.DestinationCountry,
            e.Status,
            e.MinReturnDate,
            e.RefusalReason,
            e.VisaFileUrl,
            e.CreatedOnUtc,
            e.LastModifiedOnUtc
        )).ToList();
        return result;
    }
}
