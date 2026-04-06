using Domain.Common.Repositories;
using Domain.Mails;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MimeKit;
using Polly.Registry;

namespace Infrastructure.Mails;

public sealed class MailProcessor : BackgroundService
{
    private readonly SemaphoreSlim _semaphore = new(50);

    private readonly IMailBodyBuilder _mailBodyBuilder;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ResiliencePipelineProvider<string> _pipelineProvider;
    private readonly ILogger<MailProcessor> _logger;

    public MailProcessor(
        IMailBodyBuilder mailBodyBuilder,
        IServiceScopeFactory scopeFactory,
        ResiliencePipelineProvider<string> pipelineProvider,
        ILogger<MailProcessor> logger)
    {
        _scopeFactory = scopeFactory;

        _mailBodyBuilder = mailBodyBuilder;
        _pipelineProvider = pipelineProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var mailRepository = scope.ServiceProvider.GetRequiredService<IMailRepository>();
            var mailClient = scope.ServiceProvider.GetRequiredService<IMailClient>();

            var mailsResult = await mailRepository.FindPending();
            if (mailsResult.IsError)
            {
                _logger.LogError("Error getting pending mails: {Error}", mailsResult);
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                continue;
            }

            var pendingMails = mailsResult.Value ?? [];

            var sendTasks = pendingMails.Select(async mail =>
            {
                await _semaphore.WaitAsync(stoppingToken);
                try
                {
                    using var innerScope = _scopeFactory.CreateScope();
                    var innerRepository = innerScope.ServiceProvider.GetRequiredService<IMailRepository>();
                    await SendAsync(innerRepository, mailClient, mail);
                }
                finally
                {
                    _semaphore.Release();
                }
            });

            await Task.WhenAll(sendTasks);


            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task SendAsync(IMailRepository mailRepository, IMailClient mailClient, MailEntity record)
    {
        var pipeline = _pipelineProvider.GetPipeline("mail-pipeline");

        try
        {
            await pipeline.ExecuteAsync(async token => { await SendCoreAsync(mailClient, record, token); });

            _logger.LogInformation("Mail [{MailId}] sent successfully", record.Id);

            var result = await mailRepository.UpdateStatus([record.Id], MailStatus.Sent);
            if (result.IsError) _logger.LogError("Error updating mail status: {Error}", result);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Mail [{MailId}] sent failed", record.Id);

            var result = await mailRepository.UpdateStatus([record.Id], MailStatus.Failed);
            if (result.IsError) _logger.LogError("Error updating mail status: {Error}", result);
        }
    }

    private Task SendCoreAsync(IMailClient client, MailEntity record, CancellationToken token)
    {
        var message = new MimeMessage();

        message.From.Add(new MailboxAddress("Pathora System", "no-reply@yourdomain.com"));
        message.To.Add(MailboxAddress.Parse(record.To));
        message.Subject = record.Subject;
        message.Body = _mailBodyBuilder.BuildBody(record.Template, record.Body);

        return client.SendAsync(message, token);
    }

    public override void Dispose()
    {
        _semaphore.Dispose();
        base.Dispose();
    }
}

