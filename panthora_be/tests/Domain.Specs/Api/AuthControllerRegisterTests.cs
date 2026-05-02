using global::Api.Controllers;
using global::Application.Features.Identity.Commands;
using Contracts.ModelResponse;
using ErrorOr;
using global::Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Domain.Specs.Api;

public sealed class AuthControllerRegisterTests
{
    [Fact]
    public async Task Register_WhenCommandSucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        var command = new RegisterCommand(
            Username: "admin",
            Email: "admin@example.com",
            Password: "secret123");
        var (controller, probe) = BuildController(Result.Success);

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<Success>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(command, probe.CapturedCommand);
    }

    [Fact]
    public async Task Register_WhenEmailAlreadyExists_ShouldReturnConflictResponse()
    {
        var command = new RegisterCommand(
            Username: "existing",
            Email: "existing@example.com",
            Password: "secret123");
        var (controller, _) = BuildController(Error.Conflict("Identity.EmailExists", "Email đã tồn tại"));

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status409Conflict, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status409Conflict, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.Equal("Email đã tồn tại", payload.Message);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Email đã tồn tại", payload.Errors[0].ErrorMessage);
        Assert.Equal("Identity.EmailExists", payload.Errors[0].Details);
    }

    [Fact]
    public async Task Register_WhenInputInvalid_ShouldReturnBadRequestResponse()
    {
        var command = new RegisterCommand(
            Username: "admin",
            Email: "invalid-email-format",
            Password: "123");
        var (controller, _) = BuildController(Error.Validation("Identity.InvalidInput", "Sai định dạng input"));

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.Equal("Sai định dạng input", payload.Message);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Identity.InvalidInput", payload.Errors[0].Details);
    }

    [Fact]
    public async Task Register_WhenEmailTemporarilyLocked_ShouldReturnForbiddenResponse()
    {
        var command = new RegisterCommand(
            Username: "admin",
            Email: "admin@example.com",
            Password: "secret123");
        var (controller, _) = BuildController(Error.Forbidden("Auth.EmailTemporarilyLocked", "Email này đã bị tạm khóa"));

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status403Forbidden, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Auth.EmailTemporarilyLocked", payload.Errors[0].Details);
    }

    [Fact]
    public async Task Register_WhenLockoutCheckFails_ShouldReturnInternalServerErrorResponse()
    {
        var command = new RegisterCommand(
            Username: "admin",
            Email: "admin@example.com",
            Password: "secret123");
        var (controller, _) = BuildController(Error.Failure("Auth.LockoutCheckFailed", "Unable to verify registration eligibility"));

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status500InternalServerError, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Auth.LockoutCheckFailed", payload.Errors[0].Details);
    }

    [Fact]
    public async Task Register_WhenUnexpectedError_ShouldReturnInternalServerErrorResponse()
    {
        var command = new RegisterCommand(
            Username: "admin",
            Email: "admin@example.com",
            Password: "secret123");
        var (controller, _) = BuildController(Error.Failure("Server.Error", "Lỗi máy chủ không xác định"));

        var actionResult = await controller.Register(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status500InternalServerError, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status500InternalServerError, payload.StatusCode);
        Assert.Equal("/api/auth/register", payload.Instance);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal("Server.Error", payload.Errors[0].Details);
    }


    private static (AuthController Controller, RegisterCommandProbe Probe) BuildController(ErrorOr<Success> response)
    {
        var services = new ServiceCollection();
        var probe = new RegisterCommandProbe(response);
        services.AddSingleton(probe);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RegisterCommandProbeHandler>());
        services.AddTransient<IRequestHandler<RegisterCommand, ErrorOr<Success>>, RegisterCommandProbeHandler>();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = "/api/auth/register";

        var controller = new AuthController(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        }))
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };

        return (controller, probe);
    }

    private sealed class RegisterCommandProbe(ErrorOr<Success> response)
    {
        public ErrorOr<Success> Response { get; } = response;
        public RegisterCommand? CapturedCommand { get; set; }
    }

    private sealed class RegisterCommandProbeHandler(RegisterCommandProbe probe)
        : IRequestHandler<RegisterCommand, ErrorOr<Success>>
    {
        public Task<ErrorOr<Success>> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            probe.CapturedCommand = request;
            return Task.FromResult(probe.Response);
        }
    }
}
