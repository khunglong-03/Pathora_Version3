using Api;
using Api.Boostraping;
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

// Seed disabled — uncomment only when resetting/re-seeding the database
        // var dbInitializer = app.Services.GetRequiredService<Api.Configuration.DatabaseStartupInitializer>();
        // await dbInitializer.InitializeAsync();

app.UseAppMiddleware();

app.MapControllers();
app.MapHub<Api.Hubs.NotificationsHub>("/hubs/notifications");
app.Run();

internal static class Extensions
{
    extension<T, TResult>(T)
    {
        public static TResult operator |(T source, Func<T, TResult> func) => func(source);
    }
}
