using Api.Controllers;
using Application.Contracts.Identity;
using Application.Features.Identity.Commands;
using Application.Features.Identity.Queries;
using Contracts.ModelResponse;
using ErrorOr;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Security.Claims;

namespace Domain.Specs.Api;

public sealed class AuthControllerTests
{
    [Fact]
    public async Task Login_WhenCommandSucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        var command = new LoginCommand("admin@example.com", "secret123");
        var response = new LoginResponse("access-token", "refresh-token", "admin", "/dashboard");
        var (controller, probe) = BuildController<LoginCommand, LoginResponse>(response, "/api/auth/login");

        var actionResult = await controller.Login(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<LoginResponse>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/login", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(response, payload.Data);
        Assert.Equal("admin", payload.Data?.Portal);
        Assert.Equal("/dashboard", payload.Data?.DefaultPath);
        Assert.Equal(command, probe.CapturedRequest);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=admin", setCookie);
        Assert.Contains("path=/", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_WhenCredentialsInvalid_ShouldReturnUnauthorizedResponse()
    {
        var command = new LoginCommand("admin@example.com", "wrong-password");
        var (controller, _) = BuildController<LoginCommand, LoginResponse>(
            Error.Unauthorized("Identity.InvalidCredentials", "Thông tin đăng nhập không hợp lệ"),
            "/api/auth/login");

        var actionResult = await controller.Login(command);

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status401Unauthorized,
            expectedCode: "Identity.InvalidCredentials",
            expectedMessage: "Thông tin đăng nhập không hợp lệ",
            expectedInstance: "/api/auth/login");
    }

    [Fact]
    public async Task Refresh_WhenCommandSucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        var command = new RefreshCommand("valid-refresh-token");
        var response = new RefreshTokenResponse("new-access-token", "new-refresh-token", "admin", "/dashboard");
        var (controller, probe) = BuildController<RefreshCommand, RefreshTokenResponse>(response, "/api/auth/refresh");

        var actionResult = await controller.Refresh(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<RefreshTokenResponse>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/refresh", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(response, payload.Data);
        Assert.Equal("admin", payload.Data?.Portal);
        Assert.Equal("/dashboard", payload.Data?.DefaultPath);
        Assert.Equal(command, probe.CapturedRequest);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=admin", setCookie);
        Assert.Contains("path=/", setCookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Refresh_WhenTokenInvalid_ShouldReturnUnauthorizedResponse()
    {
        var command = new RefreshCommand("invalid-refresh-token");
        var (controller, _) = BuildController<RefreshCommand, RefreshTokenResponse>(
            Error.Unauthorized("Identity.InvalidRefreshToken", "Refresh token không hợp lệ"),
            "/api/auth/refresh");

        var actionResult = await controller.Refresh(command);

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status401Unauthorized,
            expectedCode: "Identity.InvalidRefreshToken",
            expectedMessage: "Refresh token không hợp lệ",
            expectedInstance: "/api/auth/refresh");

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("access_token=", setCookie);
        Assert.Contains("refresh_token=", setCookie);
        Assert.Contains("auth_status=", setCookie);
        Assert.Contains("auth_portal=", setCookie);
        Assert.Contains("expires=thu, 01 jan 1970", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Logout_WhenCommandSucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        var command = new LogoutCommand("valid-refresh-token");
        var (controller, probe) = BuildController<LogoutCommand, Success>(Result.Success, "/api/auth/logout");

        var actionResult = await controller.Logout(command);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<Success>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/logout", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(Result.Success, payload.Data);
        Assert.Equal(command, probe.CapturedRequest);
    }

    [Fact]
    public async Task Logout_WhenRefreshTokenNotFound_ShouldReturnNotFoundResponse()
    {
        var command = new LogoutCommand("missing-refresh-token");
        var (controller, _) = BuildController<LogoutCommand, Success>(
            Error.NotFound("Identity.RefreshTokenNotFound", "Không tìm thấy refresh token"),
            "/api/auth/logout");

        var actionResult = await controller.Logout(command);

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Identity.RefreshTokenNotFound",
            expectedMessage: "Không tìm thấy refresh token",
            expectedInstance: "/api/auth/logout");
    }

    [Fact]
    public async Task Logout_WhenBodyTokenMissing_ShouldUseRefreshTokenCookie()
    {
        var command = new LogoutCommand(string.Empty);
        var (controller, probe) = BuildController<LogoutCommand, Success>(Result.Success, "/api/auth/logout");
        controller.ControllerContext.HttpContext.Request.Headers.Cookie = "refresh_token=cookie-refresh-token";

        await controller.Logout(command);

        Assert.Equal("cookie-refresh-token", probe.CapturedRequest?.RefreshToken);
    }

    [Fact]
    public async Task Logout_WhenCommandSucceeds_ShouldClearAuthCookies()
    {
        var command = new LogoutCommand("refresh-token");
        var (controller, _) = BuildController<LogoutCommand, Success>(Result.Success, "/api/auth/logout");

        await controller.Logout(command);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("access_token=", setCookie);
        Assert.Contains("refresh_token=", setCookie);
        Assert.Contains("auth_status=", setCookie);
        Assert.Contains("auth_portal=", setCookie);
    }

    [Fact]
    public async Task GetUserInfo_WhenQuerySucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        var response = new UserInfoVm(
            Id: Guid.CreateVersion7(),
            Username: "admin",
            FullName: "Administrator",
            Email: "admin@example.com",
            Avatar: null,
            ForcePasswordChange: false,
            Roles: [new UserRoleVm(1, "role-1", "Admin")],
            Departments: [new UserDepartmentVm(Guid.CreateVersion7().ToString(), "IT", null, null)],
            Portal: "admin",
            DefaultPath: "/dashboard");

        var (controller, probe) = BuildController<GetUserInfoQuery, UserInfoVm>(response, "/api/auth/me");

        var actionResult = await controller.GetUserInfo();

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<UserInfoVm>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/me", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(response, payload.Data);
        Assert.IsType<GetUserInfoQuery>(probe.CapturedRequest);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=admin", setCookie);
    }

    [Fact]
    public async Task GetUserInfo_WhenUserNotFound_ShouldReturnNotFoundResponse()
    {
        var (controller, _) = BuildController<GetUserInfoQuery, UserInfoVm>(
            Error.NotFound("Identity.UserNotFound", "Không tìm thấy người dùng"),
            "/api/auth/me");

        var actionResult = await controller.GetUserInfo();

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status404NotFound,
            expectedCode: "Identity.UserNotFound",
            expectedMessage: "Không tìm thấy người dùng",
            expectedInstance: "/api/auth/me");
    }

    [Fact]
    public async Task GetTabs_WhenQuerySucceeds_ShouldReturnOkAndWrappedSuccessPayload()
    {
        List<TabVm> response =
        [
            new TabVm(1, "Dashboard", true),
            new TabVm(2, "Tour", false)
        ];

        var (controller, probe) = BuildController<GetTabsQuery, List<TabVm>>(response, "/api/auth/tabs");

        var actionResult = await controller.GetTabs();

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<List<TabVm>>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status200OK, payload.StatusCode);
        Assert.Equal("/api/auth/tabs", payload.Instance);
        Assert.Equal("Thành công", payload.Message);
        Assert.Equal(response, payload.Data);
        Assert.IsType<GetTabsQuery>(probe.CapturedRequest);
    }

    [Fact]
    public async Task GetTabs_WhenForbidden_ShouldReturnForbiddenResponse()
    {
        var (controller, _) = BuildController<GetTabsQuery, List<TabVm>>(
            Error.Forbidden("Identity.Forbidden", "Không có quyền truy cập"),
            "/api/auth/tabs");

        var actionResult = await controller.GetTabs();

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status403Forbidden,
            expectedCode: "Identity.Forbidden",
            expectedMessage: "Không có quyền truy cập",
            expectedInstance: "/api/auth/tabs");
    }

    [Fact]
    public void DevResetPassword_ShouldAllowAnonymous()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.DevResetPassword));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public void DevResetAllPasswords_ShouldAllowAnonymous()
    {
        var method = typeof(AuthController).GetMethod(nameof(AuthController.DevResetAllPasswords));

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public async Task LogoutAll_WhenCommandSucceeds_ShouldReturnOkAndClearCookies()
    {
        var (controller, probe) = BuildController<LogoutAllCommand, Success>(
            Result.Success, "/api/auth/logout-all");

        var actionResult = await controller.LogoutAll();

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);
        Assert.IsType<LogoutAllCommand>(probe.CapturedRequest);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=; expires", setCookie);
        Assert.Contains("path=/", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task LogoutAll_WhenUnauthorized_ShouldReturnUnauthorizedWithoutClearingCookies()
    {
        var (controller, _) = BuildController<LogoutAllCommand, Success>(
            Error.Unauthorized("User.Unauthorized", "Unauthorized"),
            "/api/auth/logout-all");

        var actionResult = await controller.LogoutAll();

        AssertErrorResponse(
            actionResult,
            expectedStatusCode: StatusCodes.Status401Unauthorized,
            expectedCode: "User.Unauthorized",
            expectedMessage: "Unauthorized",
            expectedInstance: "/api/auth/logout-all");

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.DoesNotContain("auth_status=; expires", setCookie);
    }

    [Fact]
    public void GoogleLogin_WhenGoogleIsNotConfigured_ShouldRedirectToFrontendCallbackError()
    {
        var (controller, _) = BuildController<GetTabsQuery, List<TabVm>>(
            new List<TabVm>(),
            "/api/auth/google-login");
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000"
            })
            .Build();

        var actionResult = controller.GoogleLogin(configuration);

        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Equal("http://localhost:3000/auth/callback?error=google_auth_not_configured", redirectResult.Url);
    }

    [Fact]
    public async Task GoogleCallback_WhenAuthenticationFails_ShouldRedirectToFrontendWithError()
    {
        // Arrange
        var (controller, _) = BuildControllerWithExternalLogin<ExternalLoginCommand, ExternalLoginResponse>(
            Error.Unauthorized("google_auth_failed", "Authentication failed"),
            "/api/auth/google-callback",
            AuthenticateResult.Fail("Authentication failed"));

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        controller.ControllerContext.HttpContext.Request.Scheme = "http";

        // Act
        var actionResult = await controller.GoogleCallback(configuration);

        // Assert
        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Contains("error=google_auth_failed", redirectResult.Url);
    }

    [Fact]
    public async Task GoogleCallback_WhenMissingClaims_ShouldRedirectToFrontendWithError()
    {
        // Arrange
        var (controller, _) = BuildControllerWithExternalLogin<ExternalLoginCommand, ExternalLoginResponse>(
            Error.Failure("missing_claims", "Missing required claims"),
            "/api/auth/google-callback",
            AuthenticateResult.Success(
                new AuthenticationTicket(
                    new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "Missing Required")], "TestAuth")),
                    CookieAuthenticationDefaults.AuthenticationScheme)));

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        controller.ControllerContext.HttpContext.Request.Scheme = "http";

        // Act
        var actionResult = await controller.GoogleCallback(configuration);

        // Assert
        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Contains("error=missing_claims", redirectResult.Url);
    }

    [Fact]
    public async Task GoogleCallback_WhenExternalLoginSucceeds_ShouldRedirectToFrontendWithTokens()
    {
        // Arrange
        var externalLoginResponse = new ExternalLoginResponse("access-token", "refresh-token", "customer", "/home");
        var (controller, _) = BuildControllerWithExternalLogin<ExternalLoginCommand, ExternalLoginResponse>(
            externalLoginResponse,
            "/api/auth/google-callback",
            AuthenticateResult.Success(
                new AuthenticationTicket(
                    new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, "google-id-123"),
                        new Claim(ClaimTypes.Email, "customer@example.com"),
                        new Claim(ClaimTypes.Name, "Customer User")
                    ], "TestAuth")),
                    CookieAuthenticationDefaults.AuthenticationScheme)));

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        controller.ControllerContext.HttpContext.Request.Scheme = "http";

        // Act
        var actionResult = await controller.GoogleCallback(configuration);

        // Assert
        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Equal("http://localhost:3001/auth/callback", redirectResult.Url);

        // Verify auth cookies are set
        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=user", setCookie);
    }

    [Fact]
    public async Task GoogleCallback_WhenExternalLoginFails_ShouldRedirectToFrontendWithError()
    {
        // Arrange
        var (controller, _) = BuildControllerWithExternalLogin<ExternalLoginCommand, ExternalLoginResponse>(
            Error.Failure("login_failed", "Login failed"),
            "/api/auth/google-callback",
            AuthenticateResult.Success(
                new AuthenticationTicket(
                    new ClaimsPrincipal(new ClaimsIdentity(
                    [
                        new Claim(ClaimTypes.NameIdentifier, "google-id-123"),
                        new Claim(ClaimTypes.Email, "customer@example.com"),
                        new Claim(ClaimTypes.Name, "Customer User")
                    ], "TestAuth")),
                    CookieAuthenticationDefaults.AuthenticationScheme)));

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        controller.ControllerContext.HttpContext.Request.Scheme = "http";

        // Act
        var actionResult = await controller.GoogleCallback(configuration);

        // Assert
        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Contains("error=login_failed", redirectResult.Url);
    }

    [Fact]
    public void GoogleLogin_WhenFrontendUrlNotConfigured_ShouldThrow()
    {
        var (controller, _) = BuildController<GetTabsQuery, List<TabVm>>(
            new List<TabVm>(),
            "/api/auth/google-login");
        // Configuration without AppConfig:FrontendBaseUrl and Cors:AllowedOrigins
        var configuration = new ConfigurationBuilder().Build();

        var exception = Assert.Throws<InvalidOperationException>(() => controller.GoogleLogin(configuration));

        Assert.Contains("AppConfig:FrontendBaseUrl", exception.Message);
    }

    [Theory]
    [InlineData("http://localhost:3001", "http://localhost:3001/auth/callback?error=google_auth_not_configured")]
    [InlineData("https://app.pathora.com", "https://app.pathora.com/auth/callback?error=google_auth_not_configured")]
    public void GoogleLogin_WhenGoogleNotConfigured_ShouldRedirectToConfiguredOrigin(string frontendUrl, string expectedRedirect)
    {
        var (controller, _) = BuildController<GetTabsQuery, List<TabVm>>(
            new List<TabVm>(),
            "/api/auth/google-login");
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = frontendUrl
            })
            .Build();

        var actionResult = controller.GoogleLogin(configuration);

        var redirectResult = Assert.IsType<RedirectResult>(actionResult);
        Assert.Equal(expectedRedirect, redirectResult.Url);
    }

    private static (AuthController Controller, ExternalLoginProbe<TCommand, TResponse> Probe) BuildControllerWithExternalLogin<TCommand, TResponse>(
        ErrorOr<TResponse> response,
        string path,
        AuthenticateResult authenticateResult)
        where TCommand : IRequest<ErrorOr<TResponse>>
    {
        var services = new ServiceCollection();
        var probe = new ExternalLoginProbe<TCommand, TResponse>(response);
        services.AddSingleton(probe);
        services.AddSingleton<IAuthenticationService>(new FakeAuthenticationService(authenticateResult));
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RequestProbeHandler<TCommand, TResponse>>());
        services.AddTransient<IRequestHandler<TCommand, ErrorOr<TResponse>>, ExternalLoginProbeHandler<TCommand, TResponse>>();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

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

    private sealed class FakeAuthenticationService(AuthenticateResult authenticateResult) : IAuthenticationService
    {
        public Task<AuthenticateResult> AuthenticateAsync(HttpContext context, string? scheme)
        {
            return Task.FromResult(authenticateResult);
        }

        public Task ChallengeAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
        {
            return Task.CompletedTask;
        }

        public Task ForbidAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
        {
            return Task.CompletedTask;
        }

        public Task SignInAsync(HttpContext context, string? scheme, ClaimsPrincipal principal, AuthenticationProperties? properties)
        {
            return Task.CompletedTask;
        }

        public Task SignOutAsync(HttpContext context, string? scheme, AuthenticationProperties? properties)
        {
            return Task.CompletedTask;
        }
    }

    private sealed class ExternalLoginProbe<TRequest, TResponse>(ErrorOr<TResponse> response)
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public ErrorOr<TResponse> Response { get; } = response;
        public TRequest? CapturedRequest { get; set; }
    }

    private sealed class ExternalLoginProbeHandler<TRequest, TResponse>(ExternalLoginProbe<TRequest, TResponse> probe)
        : IRequestHandler<TRequest, ErrorOr<TResponse>>
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public Task<ErrorOr<TResponse>> Handle(TRequest request, CancellationToken cancellationToken)
        {
            probe.CapturedRequest = request;
            return Task.FromResult(probe.Response);
        }
    }

    private static (AuthController Controller, RequestProbe<TRequest, TResponse> Probe) BuildController<TRequest, TResponse>(
            ErrorOr<TResponse> response,
            string path)
            where TRequest : IRequest<ErrorOr<TResponse>>
    {
        var services = new ServiceCollection();
        var probe = new RequestProbe<TRequest, TResponse>(response);
        services.AddSingleton(probe);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RequestProbeHandler<TRequest, TResponse>>());
        services.AddTransient<IRequestHandler<TRequest, ErrorOr<TResponse>>, RequestProbeHandler<TRequest, TResponse>>();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

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

    private static void AssertErrorResponse(
        IActionResult actionResult,
        int expectedStatusCode,
        string expectedCode,
        string expectedMessage,
        string expectedInstance)
    {
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(expectedStatusCode, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(expectedStatusCode, payload.StatusCode);
        Assert.Equal(expectedInstance, payload.Instance);
        Assert.Equal(expectedMessage, payload.Message);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal(expectedMessage, payload.Errors[0].ErrorMessage);
        Assert.Equal(expectedCode, payload.Errors[0].Details);
    }

    private sealed class RequestProbe<TRequest, TResponse>(ErrorOr<TResponse> response)
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public ErrorOr<TResponse> Response { get; } = response;
        public TRequest? CapturedRequest { get; set; }
    }

    private sealed class RequestProbeHandler<TRequest, TResponse>(RequestProbe<TRequest, TResponse> probe)
        : IRequestHandler<TRequest, ErrorOr<TResponse>>
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public Task<ErrorOr<TResponse>> Handle(TRequest request, CancellationToken cancellationToken)
        {
            probe.CapturedRequest = request;
            return Task.FromResult(probe.Response);
        }
    }
}
