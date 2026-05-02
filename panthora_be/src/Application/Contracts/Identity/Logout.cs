using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public sealed record LogoutRequest([property: JsonPropertyName("refreshToken")] string RefreshToken);

