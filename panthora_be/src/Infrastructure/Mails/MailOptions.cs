namespace Infrastructure.Mails;

public class MailOptions
{
    public const string Mail = "Mail";
    public string Host { get; init; } = null!;
    public int Port { get; init; }
    public bool UseAuthentication { get; init; }
    public string UserName { get; init; } = null!;
    public string Password { get; init; } = null!;
}

