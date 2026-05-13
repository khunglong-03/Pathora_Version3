using Application;
using Infrastructure;

namespace ApiPublic;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Logging.ClearProviders();
        builder.Services.AddApplicationServices();
        builder.Services.AddInfrastructureServices(builder.Configuration);
        builder.Services.AddPublicApiServices(builder.Configuration);

        builder.AddCorsPolicy();
        builder.AddHealthChecks();

        var app = builder.Build();

        app.UsePublicApiMiddleware();

        app.MapControllers();
        app.Run();
    }
}