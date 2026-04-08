namespace Application.Features.TransportProvider.Company.DTOs;

public sealed record TransportCompanyProfileDto(
    Guid UserId,
    string CompanyName,
    string? Address,
    string? Phone,
    string? Email
);

public sealed record UpdateTransportCompanyCommandDto(
    string? CompanyName,
    string? Address,
    string? Phone,
    string? Email
);