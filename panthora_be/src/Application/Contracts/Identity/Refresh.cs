namespace Application.Contracts.Identity;

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record RefreshTokenResponse(
    string AccessToken,
    string RefreshToken,
    string Portal,
    string DefaultPath);
