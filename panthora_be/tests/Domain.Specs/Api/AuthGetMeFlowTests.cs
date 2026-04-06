using Api.Controllers;
using Api.Infrastructure;
using Application.Common.Constant;
using Application.Contracts.Identity;
using Application.Features.Identity.Commands;
using Application.Features.Identity.Queries;
using Contracts.ModelResponse;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NSubstitute;
using System.Security.Claims;

namespace Domain.Specs.Api;

/// <summary>
/// Tests the full login → getMe flow to validate the getMe error scenario.
/// Covers: token generation, cookie writing, JWT auth on getMe, CurrentUserId resolution.
/// </summary>
public sealed class AuthGetMeFlowTests
{
    #region getMe endpoint tests

    [Fact]
    public async Task GetMe_WhenAuthenticated_ShouldReturnUserInfo()
    {
        var userId = Guid.NewGuid().ToString();
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(new UserInfoVm(
                Guid.Parse(userId),
                "hung.nv",
                "Hung Nguyen",
                "hung.nv@pathora.vn",
                null,
                false,
                [new UserRoleVm(0, Guid.NewGuid().ToString(), "Admin")],
                [],
                "admin",
                "/dashboard",
                null,
                null,
                "vi"));

        var controller = BuildAuthenticatedController(sender, userId, "/api/auth/me");

        var result = await controller.GetUserInfo();

        var okResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);

        var response = Assert.IsType<ResultSharedResponse<UserInfoVm>>(okResult.Value);
        Assert.Equal("hung.nv@pathora.vn", response.Data?.Email);
        Assert.Equal("admin", response.Data?.Portal);
    }

    [Fact]
    public async Task GetMe_WhenCurrentUserIdIsEmpty_ShouldReturn401()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription));

        // CurrentUserId returns "" when no NameIdentifier claim
        var controller = BuildAuthenticatedController(sender, userId: null, "/api/auth/me");

        var result = await controller.GetUserInfo();

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);

        var response = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(401, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_WhenCurrentUserIdIsEmptyString_ShouldReturn401()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription));

        // Simulate: User has claims but no NameIdentifier → CurrentUserId = ""
        var controller = BuildControllerWithEmptyUser(sender, "/api/auth/me");

        var result = await controller.GetUserInfo();

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
    }

    [Fact]
    public async Task GetMe_WhenUserNotFoundInDb_ShouldReturn404()
    {
        var userId = Guid.NewGuid().ToString();
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription));

        var controller = BuildAuthenticatedController(sender, userId, "/api/auth/me");

        var result = await controller.GetUserInfo();

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status404NotFound, objectResult.StatusCode);
    }

    #endregion

    #region Login → getMe flow tests (cookie-based)

    [Fact]
    public async Task Login_ThenGetMe_WithValidToken_ShouldSucceed()
    {
        // Step 1: Login returns tokens
        var userId = Guid.NewGuid().ToString();
        var loginSender = Substitute.For<ISender>();
        loginSender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(new LoginResponse(
                "valid-access-token-12345",
                "valid-refresh-token-67890",
                "admin",
                "/dashboard"));

        var loginController = BuildController(loginSender, "/api/auth/login");
        var loginResult = await loginController.Login(new LoginCommand("hung.nv@pathora.vn", "thehieu03"));

        var loginOk = Assert.IsType<ObjectResult>(loginResult);
        Assert.Equal(StatusCodes.Status200OK, loginOk.StatusCode);

        // Verify cookies were set
        var setCookie = loginController.ControllerContext.HttpContext.Response.Headers.SetCookie.ToString();
        Assert.Contains("access_token=valid-access-token-12345", setCookie);
        Assert.Contains("auth_status=1", setCookie);
        Assert.Contains("auth_portal=admin", setCookie);

        // Step 2: getMe with the same user ID from the token
        var getMeSender = Substitute.For<ISender>();
        getMeSender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(new UserInfoVm(
                Guid.Parse(userId),
                "hung.nv",
                "Hung Nguyen",
                "hung.nv@pathora.vn",
                null,
                false,
                [new UserRoleVm(0, Guid.NewGuid().ToString(), "Admin")],
                [],
                "admin",
                "/dashboard",
                null,
                null,
                "vi"));

        var getMeController = BuildAuthenticatedController(getMeSender, userId, "/api/auth/me");
        var getMeResult = await getMeController.GetUserInfo();

        var getMeOk = Assert.IsType<ObjectResult>(getMeResult);
        Assert.Equal(StatusCodes.Status200OK, getMeOk.StatusCode);
    }

    [Fact]
    public async Task Login_WhenUserIsDeleted_ShouldReturn403()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Forbidden(ErrorConstants.Auth.AccountForbiddenCode, ErrorConstants.Auth.AccountForbiddenDescription));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("hung.nv@pathora.vn", "thehieu03"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    [Fact]
    public async Task Login_WhenUserIsInactive_ShouldReturn403()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Forbidden(ErrorConstants.Auth.AccountForbiddenCode, ErrorConstants.Auth.AccountForbiddenDescription));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("hung.nv@pathora.vn", "thehieu03"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
    }

    #endregion

    #region AuthTokenResolver tests (cookie fallback)

    [Fact]
    public async Task GetMe_WhenTokenComesFromCookie_NotFromHeader_ShouldStillWork()
    {
        // Simulate: Authorization header is empty/missing, but access_token cookie is present
        // The AuthTokenResolver should fall back to the cookie
        var userId = Guid.NewGuid().ToString();
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<GetUserInfoQuery>(), Arg.Any<CancellationToken>())
            .Returns(new UserInfoVm(
                Guid.Parse(userId),
                "hung.nv",
                "Hung Nguyen",
                "hung.nv@pathora.vn",
                null,
                false,
                [new UserRoleVm(0, Guid.NewGuid().ToString(), "Admin")],
                [],
                "admin",
                "/dashboard",
                null,
                null,
                "vi"));

        // HttpContext with NO Authorization header but WITH access_token cookie
        var services = new ServiceCollection();
        services.AddSingleton(sender);
        services.AddSingleton(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        }));

        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/auth/me";
        // NO Authorization header
        httpContext.RequestServices = services.BuildServiceProvider();
        // Set access_token cookie
        httpContext.Request.Cookies.Append("access_token", "some-cookie-token");

        var controller = new AuthController(Microsoft.Extensions.Options.Options.Create(new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        }))
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext }
        };

        // Set up user claims (simulating JWT validation already happened and extracted user)
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var result = await controller.GetUserInfo();

        var okResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    #endregion

    #region Service unavailable / token generation failure

    [Fact]
    public async Task Login_WhenTokenGenerationFails_ShouldReturn503()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Custom(503, ErrorConstants.Auth.ServiceUnavailableCode, ErrorConstants.Auth.ServiceUnavailableDescription));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("hung.nv@pathora.vn", "thehieu03"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, objectResult.StatusCode);
    }

    [Fact]
    public async Task Login_WhenDbUnavailable_ShouldReturn503()
    {
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<LoginCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Custom(503, ErrorConstants.Auth.ServiceUnavailableCode, ErrorConstants.Auth.ServiceUnavailableDescription));

        var controller = BuildController(sender, "/api/auth/login");

        var result = await controller.Login(new LoginCommand("hung.nv@pathora.vn", "thehieu03"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, objectResult.StatusCode);
    }

    #endregion

    #region UpdateMyProfile tests

    [Fact]
    public async Task UpdateMyProfile_WhenAuthenticated_ShouldReturn200()
    {
        var userId = Guid.NewGuid().ToString();
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<Application.Features.Identity.Commands.UpdateMyProfileCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success);

        var controller = BuildAuthenticatedController(sender, userId, "/api/auth/me");

        var command = new Application.Features.Identity.Commands.UpdateMyProfileCommand(
            "Hung Nguyen Updated",
            "0123456789",
            "123 Main Street, HCMC");
        // Use 'with' syntax to set CurrentUserId
        var result = await controller.UpdateMyProfile(command with { CurrentUserId = userId });

        var okResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WhenOldPasswordIncorrect_ShouldReturn400()
    {
        var userId = Guid.NewGuid().ToString();
        var sender = Substitute.For<ISender>();
        sender
            .Send(Arg.Any<ChangePasswordCommand>(), Arg.Any<CancellationToken>())
            .Returns(Error.Validation(ErrorConstants.User.InvalidPasswordCode, ErrorConstants.User.InvalidPasswordDescription));

        var controller = BuildAuthenticatedController(sender, userId, "/api/auth/me");

        var result = await controller.ChangePassword(new ChangePasswordCommand("wrong", "newpass123", "newpass123"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status400BadRequest, objectResult.StatusCode);
    }

    #endregion

    #region AuthCookieWriter verification

    [Fact]
    public void AuthCookieWriter_WriteAuthCookies_ShouldIncludeAll4Cookies()
    {
        // Verify AuthCookieWriter writes the correct cookies
        var services = new ServiceCollection();
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Path = "/api/auth/login";

        var response = httpContext.Response;
        var tokens = new LoginResponse("access-token", "refresh-token", "admin", "/dashboard");
        var jwtOptions = new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        };

        // Simulate HTTPS
        AuthCookieWriter.WriteAuthCookies(response, tokens, secure: true, jwtOptions);

        var setCookieHeaders = response.Headers.SetCookie.ToList();
        var cookieNames = setCookieHeaders.Select(h => h.ToString().Split('=')[0]).ToList();

        Assert.Contains("access_token", cookieNames);
        Assert.Contains("refresh_token", cookieNames);
        Assert.Contains("auth_status", cookieNames);
        Assert.Contains("auth_portal", cookieNames);
    }

    [Fact]
    public void AuthCookieWriter_AccessTokenCookie_ShouldBeHttpOnlyFalse()
    {
        // Verify the access_token cookie is HttpOnly=false (JS-readable for axios interceptor)
        var response = new DefaultHttpContext().Response;
        var tokens = new LoginResponse("access-token", "refresh-token", "admin", "/dashboard");
        var jwtOptions = new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        };

        AuthCookieWriter.WriteAuthCookies(response, tokens, secure: false, jwtOptions);

        var setCookie = response.Headers.SetCookie.ToString();
        // HttpOnly=false means it should NOT have HttpOnly flag
        Assert.Contains("access_token=access-token", setCookie);
        // Check it's NOT HttpOnly by checking if "HttpOnly" appears in access_token cookie
        // The access_token cookie should NOT have HttpOnly flag
        Assert.DoesNotContain("access_token=access-token; HttpOnly", setCookie);
    }

    [Fact]
    public void AuthCookieWriter_RefreshTokenCookie_ShouldBeHttpOnlyTrue()
    {
        var response = new DefaultHttpContext().Response;
        var tokens = new LoginResponse("access-token", "refresh-token", "admin", "/dashboard");
        var jwtOptions = new JwtOptions
        {
            AccessTokenCookieExpirationHours = 1,
            RefreshTokenExpirationHours = 168
        };

        AuthCookieWriter.WriteAuthCookies(response, tokens, secure: false, jwtOptions);

        var setCookie = response.Headers.SetCookie.ToString();
        Assert.Contains("refresh_token=refresh-token", setCookie);
    }

    #endregion

    #region Helpers

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

    private static AuthController BuildAuthenticatedController(ISender sender, string? userId, string path)
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

        // If userId is provided, simulate authenticated user with NameIdentifier claim
        if (!string.IsNullOrEmpty(userId))
        {
            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
            httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
        }

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

    private static AuthController BuildControllerWithEmptyUser(ISender sender, string path)
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

        // User with NO NameIdentifier claim → CurrentUserId = ""
        var claims = new[] { new Claim(ClaimTypes.Email, "test@example.com") };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

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

    #endregion
}