namespace Application.Options;

public class AuthOptions
{
    public int PasswordResetTokenExpirationMinutes { get; init; } = 15;
    public int EmailConfirmationExpiryMinutes { get; init; } = 180;
}
