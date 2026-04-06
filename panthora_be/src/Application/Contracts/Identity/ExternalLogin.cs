namespace Application.Contracts.Identity;

public sealed record ExternalLoginRequest(string Provider, string ProviderKey, string ProviderEmail, string FullName, string? Picture = null);

public sealed record ExternalLoginResponse(
    string AccessToken,
    string RefreshToken,
    string Portal,
    string DefaultPath);

