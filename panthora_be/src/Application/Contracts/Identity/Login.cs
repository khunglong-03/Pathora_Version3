using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record LoginRequest(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password
);

public sealed record LoginResponse(
    [property: JsonPropertyName("accessToken")] string AccessToken,
    [property: JsonPropertyName("refreshToken")] string RefreshToken,
    [property: JsonPropertyName("portal")] string Portal,
    [property: JsonPropertyName("defaultPath")] string DefaultPath
);
