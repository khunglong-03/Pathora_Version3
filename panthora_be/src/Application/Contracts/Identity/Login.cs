namespace Application.Contracts.Identity;

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record LoginResponse(
    string AccessToken,
    string RefreshToken,
    string Portal,
    string DefaultPath
);
