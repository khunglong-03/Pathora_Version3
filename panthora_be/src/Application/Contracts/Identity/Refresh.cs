using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record RefreshTokenRequest([property: JsonPropertyName("refreshToken")] string RefreshToken);

public sealed record RefreshTokenResponse(
    [property: JsonPropertyName("accessToken")] string AccessToken,
    [property: JsonPropertyName("refreshToken")] string RefreshToken,
    [property: JsonPropertyName("portal")] string Portal,
    [property: JsonPropertyName("defaultPath")] string DefaultPath);
