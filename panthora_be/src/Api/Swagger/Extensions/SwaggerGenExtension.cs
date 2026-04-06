using Api.Swagger;
using Microsoft.OpenApi;

namespace Api.Swagger.Extensions;

public static class SwaggerGenExtension
{
    public static IServiceCollection AddSwaggerServices(
        this IServiceCollection services,
        IConfiguration cfg)
    {
        var serviceName = cfg["AppConfig:ServiceName"] ?? "API";
        var title = cfg["SwaggerGen:Title"] ?? serviceName;
        var version = cfg["SwaggerGen:Version"] ?? "v1";
        var description = cfg["SwaggerGen:Description"] ?? $"API for {serviceName}";
        var contactName = cfg["SwaggerGen:ContactName"];
        var contactEmail = cfg["SwaggerGen:ContactEmail"];
        var contactUrl = cfg["SwaggerGen:ContactUrl"];
        var developer = cfg["SwaggerGen:dev"];
        var fullDescription = BuildFullDescription(
            description,
            developer,
            contactName,
            contactEmail,
            contactUrl);

        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, _, _) =>
            {
                document.Info = new OpenApiInfo
                {
                    Title = title,
                    Version = version,
                    Description = fullDescription,
                    Contact = new OpenApiContact
                    {
                        Name = contactName,
                        Email = contactEmail,
                        Url = !string.IsNullOrEmpty(contactUrl)
                            ? new Uri(contactUrl)
                            : null
                    }
                };

                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
                document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Name = "Authorization",
                    Description = "Enter: Bearer {token}"
                };

                document.Security =
                [
                    new OpenApiSecurityRequirement
                    {
                        { new OpenApiSecuritySchemeReference("Bearer"), [] }
                    }
                ];

                document.SetReferenceHostDocument();
                return Task.CompletedTask;
            });

            options.AddOperationTransformer<AuthorizeCheckOperationFilter>();
        });

        return services;
    }

    public static WebApplication UseSwaggerApi(this WebApplication app)
    {
        var serviceName = app.Configuration["AppConfig:ServiceName"] ?? "API";

        app.MapOpenApi();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", $"{serviceName} v1");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = serviceName;
        });

        app.MapGet("/", () => Results.Redirect("/swagger", false));

        return app;
    }

    private static string BuildFullDescription(
        string description,
        string? developer,
        string? contactName,
        string? contactEmail,
        string? contactUrl)
    {
        var sections = new List<string> { description };

        if (!string.IsNullOrWhiteSpace(developer))
        {
            sections.Add($"**Developer:** {developer}");
        }

        if (!string.IsNullOrWhiteSpace(contactName))
        {
            sections.Add($"**Contact Name:** {contactName}");
        }

        if (!string.IsNullOrWhiteSpace(contactEmail))
        {
            sections.Add($"**Contact Email:** {contactEmail}");
        }

        if (!string.IsNullOrWhiteSpace(contactUrl))
        {
            sections.Add($"**Contact Url:** {contactUrl}");
        }

        return string.Join("\n\n", sections);
    }
}
