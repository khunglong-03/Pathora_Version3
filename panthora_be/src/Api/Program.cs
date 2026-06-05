using Api;
using Api.Bosttraping;
using Application;
using Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApiServices(builder.Configuration);

builder.AddCorsPolicy();
builder.AddHealthChecks();

var app = builder.Build();

Application.Services.SepayParsingHelper.SetLogger(app.Services.GetService<Microsoft.Extensions.Logging.ILogger>());

app.UseAppMiddleware();

app.MapControllers();
app.MapHub<Api.Hubs.NotificationsHub>("/api/hubs/notifications").AllowAnonymous();

// Initialize database startup lifecycle (migrations, seed data, and sequence guards)
using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<Api.Configuration.DatabaseStartupInitializer>();
    await initializer.InitializeAsync();
}

app.Run();

internal static class Extensions
{
    extension<T, TResult>(T)
    {
        public static TResult operator |(T source, Func<T, TResult> func) => func(source);
    }
}
