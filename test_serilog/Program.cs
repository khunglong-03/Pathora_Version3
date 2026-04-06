using Microsoft.AspNetCore.Builder;
using Serilog.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
IApplicationBuilder b = app;
b.UseSerilogRequestLogging();
app.Run();
