using Api.Controllers;
using Application.Contracts.Identity;
using Application.Features.Identity.Commands;
using Contracts.ModelResponse;
using ErrorOr;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using System.Security.Claims;

namespace Domain.Specs.Api;

public sealed class AuthLoginFlowBackendTests
{
    [Fact]
    public async Task EmailLogin_WhenCredentialsValid_ShouldReturn200AndSetAuthCookies()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(new LoginResponse("access-token", "refresh-token", "admin", "/dashboard"));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("admin@example.com", "secret123"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=admin", setCookie);
    }

    [Fact]
    public async Task EmailLogin_WhenCredentialsInvalid_ShouldReturn401()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Unauthorized("Identity.InvalidCredentials", "Thông tin đăng nhập không hợp lệ"));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("admin@example.com", "wrong-password"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    [Fact]
    public async Task EmailLogin_WhenInputFormatInvalid_ShouldReturn400()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Validation("Identity.InvalidInput", "Sai định dạng input"));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("invalid-email-format", "secret123"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
        Assert.Equal("Identity.InvalidInput", payload.Errors?[0].Details);
    }

    [Fact]
    public async Task EmailLogin_WhenPasswordContainsSqlInjectionPattern_ShouldReturn400WithoutServerError()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Validation("Identity.InvalidPasswordFormat", "Mật khẩu sai định dạng"));

        var controller = BuildController(sender, "/api/auth/login");
        const string maliciousPassword = "' OR 1=1 --";

        var result = await controller.Login(new LoginCommand("admin@example.com", maliciousPassword));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
        Assert.Equal("Identity.InvalidPasswordFormat", payload.Errors?[0].Details);
    }

    [Fact]
    public async Task GoogleCallback_WhenAuthenticateFails_ShouldRedirectWithGoogleAuthFailedError()
    {
        var sender = Substitute.For<ISender>();
        var controller = BuildControllerWithAuthentication(
            sender,
            AuthenticateResult.Fail("Authentication failed"),
            "/api/auth/google-callback");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        var result = await controller.GoogleCallback(configuration);

        var redirect = Assert.IsType<RedirectResult>(result);
        Assert.Equal("http://localhost:3001/auth/callback?error=google_auth_failed", redirect.Url);
    }

    [Fact]
    public async Task GoogleCallback_WhenClaimsValid_ShouldRedirectToFrontendAndSetAuthCookies()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<ExternalLoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(new ExternalLoginResponse("access-token", "refresh-token", "customer", "/home"));

        var authenticateResult = AuthenticateResult.Success(
            new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, "google-id-123"),
                    new Claim(ClaimTypes.Email, "customer@example.com"),
                    new Claim(ClaimTypes.Name, "Customer User")
                ], "TestAuth")),
                CookieAuthenticationDefaults.AuthenticationScheme));

        var controller = BuildControllerWithAuthentication(
            sender,
            authenticateResult,
            "/api/auth/google-callback");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        var result = await controller.GoogleCallback(configuration);

        var redirect = Assert.IsType<RedirectResult>(result);
        Assert.Equal("http://localhost:3001/auth/callback", redirect.Url);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=user", setCookie);
    }

    [Fact]
    public async Task GoogleCallback_WhenMissingEmailClaim_ShouldRedirectWithMissingClaimsErrorAndClearCookies()
    {
        var sender = Substitute.For<ISender>();
        var authenticateResult = AuthenticateResult.Success(
            new AuthenticationTicket(
                new ClaimsPrincipal(new ClaimsIdentity(
                [
                    new Claim(ClaimTypes.NameIdentifier, "google-id-123"),
                    new Claim(ClaimTypes.Name, "Customer User")
                ], "TestAuth")),
                CookieAuthenticationDefaults.AuthenticationScheme));

        var controller = BuildControllerWithAuthentication(
            sender,
            authenticateResult,
            "/api/auth/google-callback");

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Cors:AllowedOrigins:0"] = "http://localhost:3001"
            })
            .Build();

        var result = await controller.GoogleCallback(configuration);

        var redirect = Assert.IsType<RedirectResult>(result);
        Assert.Equal("http://localhost:3001/auth/callback?error=missing_claims", redirect.Url);

        var setCookie = controller.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("auth_status=", setCookie);
        Assert.Contains("auth_portal=", setCookie);
    }

    private static AuthController BuildController(ISender sender, string path)
    {
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        }));

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

        return new AuthController(Microsoft.Extensions.Options.Options.Create(new JwtOptions
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
    }

    private static AuthController BuildControllerWithAuthentication(
        ISender sender,
        AuthenticateResult authenticateResult,
        string path)
    {
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        services.AddSingleton<IAuthenticationService>(new FakeAuthenticationService(authenticateResult));
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        }));

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

        return new AuthController(Microsoft.Extensions.Options.Options.Create(new JwtOptions
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
}
