using Application.Common.Interfaces;
using Infrastructure.Options;
using System.Net;
using System.Net.Http.Headers;
using CloudinaryDotNet;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Infrastructure.Files;

public static class DependencyInjection
{
    internal static IServiceCollection AddFileService(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorageOptions>(configuration.GetSection("Storage"));

        services.AddSingleton(sp =>
        {
            var cloudName = configuration["Cloudinary:CloudName"]
                ?? throw new Exception("Cloudinary:CloudName is missing");
            var apiKey = configuration["Cloudinary:ApiKey"]
                ?? throw new Exception("Cloudinary:ApiKey is missing");
            var apiSecret = configuration["Cloudinary:ApiSecret"]
                ?? throw new Exception("Cloudinary:ApiSecret is missing");

            return new Cloudinary(new Account(cloudName, apiKey, apiSecret));
        });
        services.AddScoped<ICloudinaryClient, CloudinaryClientAdapter>();
        services.AddScoped<IFileManager, FileManager>();
        services.AddScoped<ICloudinaryService, CloudinaryCloudService>();

        // SeaweedFS client — kept separate from Cloudinary migration
        services.AddHttpClient<ISeaweedClient, SeaweedClient>(client =>
            {
                var seaweedUrl = configuration["Seaweed:Url"];
                if (!string.IsNullOrEmpty(seaweedUrl))
                {
                    client.BaseAddress = new Uri(seaweedUrl);
                }
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            })
            .ConfigurePrimaryHttpMessageHandler(() =>
                new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback =
                        HttpClientHandler.DangerousAcceptAnyServerCertificateValidator,
                    CookieContainer = new CookieContainer()
                }
            );
        return services;
    }
}
