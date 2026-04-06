using Infrastructure.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace Infrastructure.Mails;

internal static class DependencyInjection
{
    internal static IServiceCollection AddMailService(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MailOptions>(configuration.GetSection(MailOptions.Mail));
        services.Configure<MailServiceOptions>(configuration.GetSection("Mail"));
        services.AddScoped<IMailClient, MailClient>();

        services.AddSingleton<IMailBodyBuilder, MailBodyBuilder>();

        // services.AddHostedService<MailProcessor>();

        services.AddResiliencePipeline("mail-pipeline", cfg =>
        {
            cfg.AddRetry(new RetryStrategyOptions
            {
                ShouldHandle = new PredicateBuilder().Handle<Exception>(),
                BackoffType = DelayBackoffType.Exponential,
                Delay = TimeSpan.FromSeconds(1),
                MaxRetryAttempts = 3,
                MaxDelay = TimeSpan.FromMilliseconds(1500),
                UseJitter = true
            })
                .AddTimeout(TimeSpan.FromSeconds(30));
        });

        return services;
    }
}

