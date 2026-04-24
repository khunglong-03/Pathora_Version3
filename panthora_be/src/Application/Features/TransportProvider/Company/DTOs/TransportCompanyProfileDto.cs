using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Company.DTOs;

public sealed record TransportCompanyProfileDto(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("companyName")] string CompanyName,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email
);

public sealed record UpdateTransportCompanyCommandDto(
    [property: JsonPropertyName("companyName")] string? CompanyName,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email
);