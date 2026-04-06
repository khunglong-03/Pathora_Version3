using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Infrastructure.Mails;

public interface IMailClient
{
    public Task SendAsync(
        MimeMessage mailMessage,
        CancellationToken cancellationToken = default);
}

public class MailClient : IMailClient
{
    private readonly IOptions<MailOptions> _mailOptions;
    private readonly ILogger<MailClient> _logger;

    public MailClient(IOptions<MailOptions> mailOptions, ILogger<MailClient> logger)
    {
        _mailOptions = mailOptions;
        _logger = logger;
    }

    public async Task SendAsync(
        MimeMessage mailMessage,
        CancellationToken cancellationToken = default)
    {
        using var client = new SmtpClient();

        await client.ConnectAsync(
            _mailOptions.Value.Host,
            _mailOptions.Value.Port,
            SecureSocketOptions.Auto,
            cancellationToken);

        if (_mailOptions.Value.UseAuthentication)
        {
            await client.AuthenticateAsync(
                _mailOptions.Value.UserName,
                _mailOptions.Value.Password,
                cancellationToken);
        }

        var result = await client.SendAsync(mailMessage, cancellationToken);
        _logger.LogInformation("Sent mail result: {Result}", result);
    }
}

