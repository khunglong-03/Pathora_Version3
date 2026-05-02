using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record ExternalLoginRequest(
    [property: JsonPropertyName("provider")] string Provider,
    [property: JsonPropertyName("providerKey")] string ProviderKey,
    [property: JsonPropertyName("providerEmail")] string ProviderEmail,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("picture")] string? Picture = null);

public sealed record ExternalLoginResponse(
    [property: JsonPropertyName("accessToken")] string AccessToken,
    [property: JsonPropertyName("refreshToken")] string RefreshToken,
    [property: JsonPropertyName("portal")] string Portal,
    [property: JsonPropertyName("defaultPath")] string DefaultPath);

