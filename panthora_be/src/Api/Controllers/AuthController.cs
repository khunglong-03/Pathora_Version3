using Api.Endpoint;
using Application.Contracts.Identity;
using Contracts.Interfaces;
using Application.Features.Identity.Commands;
using Application.Features.Identity.Queries;
using ErrorOr;
using Infrastructure.Data;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

[Route(AuthEndpoint.Base)]
[EnableRateLimiting("auth-strict")]
public class AuthController(IOptions<JwtOptions> jwtOptions) : BaseApiController
{
    [AllowAnonymous]
    [HttpPost(AuthEndpoint.Login)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await Sender.Send(command);

        if (!result.IsError && !Response.HasStarted)
        {
            AuthCookieWriter.WriteAuthCookies(Response, result.Value, Request.IsHttps, jwtOptions.Value);
        }

        return base.HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(AuthEndpoint.LoginWithRoles)]
    public async Task<IActionResult> LoginWithRoles([FromBody] LoginWithRolesCommand command)
    {
        var result = await Sender.Send(command);

        if (!result.IsError && !Response.HasStarted)
        {
            AuthCookieWriter.WriteAuthCookies(Response, result.Value, Request.IsHttps, jwtOptions.Value);
        }

        return base.HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(AuthEndpoint.Register)]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(AuthEndpoint.Refresh)]
    public async Task<IActionResult> Refresh([FromBody] RefreshCommand command)
    {
        var refreshToken = string.IsNullOrWhiteSpace(command.RefreshToken)
            ? Request.Cookies["refresh_token"] ?? string.Empty
            : command.RefreshToken;

        var result = await Sender.Send(command with { RefreshToken = refreshToken });

        if (!result.IsError)
        {
            Response.Cookies.Append("access_token", result.Value.AccessToken, new CookieOptions
            {
                HttpOnly = false,
                IsEssential = true,
                MaxAge = TimeSpan.FromHours(jwtOptions.Value.AccessTokenCookieExpirationHours),
                Path = "/",
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Secure = Request.IsHttps
            });
            Response.Cookies.Append("refresh_token", result.Value.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                IsEssential = true,
                MaxAge = TimeSpan.FromHours(jwtOptions.Value.RefreshTokenExpirationHours),
                Path = "/",
                SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Secure = Request.IsHttps
            });
            AuthCookieWriter.WriteAuthStatusCookie(Response, Request.IsHttps);
            AuthCookieWriter.WriteAuthPortalCookie(Response, result.Value.Portal, Request.IsHttps);
        }
        else if (result.Errors.Any(error => error.Type is ErrorType.Unauthorized or ErrorType.NotFound))
        {
            try
            {
                AuthCookieWriter.ClearAuthCookies(Response, Request.IsHttps);
            }
            catch (InvalidOperationException)
            {
            }
        }

        return HandleResult(result);
    }
    [AllowAnonymous]
    [HttpPost(AuthEndpoint.ConfirmRegister)]
    public async Task<IActionResult> ConfirmRegister([FromBody] ConfirmCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(AuthEndpoint.ForgotPassword)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var result = await Sender.Send(new ForgotPasswordCommand(request));
        return HandleResult(result);
    }

    [AllowAnonymous]
    [HttpPost(AuthEndpoint.ResetPassword)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var result = await Sender.Send(new ResetPasswordCommand(request));
        return HandleResult(result);
    }

    [Authorize]
    [HttpPost(AuthEndpoint.Logout)]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand command)
    {
        var refreshToken = string.IsNullOrWhiteSpace(command.RefreshToken)
            ? Request.Cookies["refresh_token"] ?? string.Empty
            : command.RefreshToken;

        var result = await Sender.Send(command with { RefreshToken = refreshToken });
        if (result.IsError) return HandleResult(result);
        try
        {
            AuthCookieWriter.ClearAuthCookies(Response, Request.IsHttps);
        }
        catch (InvalidOperationException)
        {
            // Response has already started — cookies cannot be cleared.
        }

        return HandleResult(result);
    }

    [Authorize]
    [HttpPost(AuthEndpoint.LogoutAll)]
    public async Task<IActionResult> LogoutAll()
    {
        var result = await Sender.Send(new LogoutAllCommand());
        if (result.IsError) return HandleResult(result);
        try
        {
            AuthCookieWriter.ClearAuthCookies(Response, Request.IsHttps);
        }
        catch (InvalidOperationException)
        {
            // Response has already started — cookies cannot be cleared.
        }

        return HandleResult(result);
    }

    [Authorize]
    [HttpPut(AuthEndpoint.Me)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] Application.Features.Identity.Commands.UpdateMyProfileCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize]
    [HttpPut(AuthEndpoint.ChangePassword)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var result = await Sender.Send(command);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet(AuthEndpoint.Me)]
    public async Task<IActionResult> GetUserInfo()
    {
        var result = await Sender.Send(new GetUserInfoQuery(CurrentUserId));

        if (!result.IsError)
        {
            try
            {
                AuthCookieWriter.WriteAuthStatusCookie(Response, Request.IsHttps);
                AuthCookieWriter.WriteAuthPortalCookie(Response, result.Value.Portal, Request.IsHttps);
            }
            catch (InvalidOperationException)
            {
                // Response has already started — cookies cannot be set.
            }
        }

        return HandleResult(result);
    }

    [Authorize]
    [HttpGet(AuthEndpoint.Tabs)]
    public async Task<IActionResult> GetTabs()
    {
        var result = await Sender.Send(new GetTabsQuery(CurrentUserId));
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet(AuthEndpoint.MeSettings)]
    public async Task<IActionResult> GetUserSettings()
    {
        var result = await Sender.Send(new GetUserSettingsQuery(CurrentUserId));
        return HandleResult(result);
    }

    [Authorize]
    [HttpPut(AuthEndpoint.MeSettings)]
    public async Task<IActionResult> UpdateUserSettings([FromBody] UpdateUserSettingsCommand command)
    {
        var result = await Sender.Send(command with { CurrentUserId = CurrentUserId });
        return HandleResult(result);
    }

    [Authorize]
    [HttpPost(UploadEndpoint.Avatar)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
    {
        if (file.Length == 0)
            return BadRequest(new { message = "File is empty." });

        await using var stream = file.OpenReadStream();
        var result = await Sender.Send(new UploadAvatarCommand(
            stream,
            file.FileName,
            file.ContentType ?? "application/octet-stream",
            file.Length,
            CurrentUserId));
        return HandleResult(result);
    }

    /// <summary>DEV ONLY – reset a user password without authentication.</summary>
    [AllowAnonymous]
    [HttpPost(AuthEndpoint.DevResetPassword)]
    public async Task<IActionResult> DevResetPassword(
        [FromBody] DevResetPasswordRequest request,
        [FromServices] AppDbContext db,
        [FromServices] IPasswordHasher hasher,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IConfiguration configuration)
    {
        if (!env.IsDevelopment() || !configuration.GetValue<bool>("Dev:EnableDevEndpoints"))
            return NotFound();

        if (!IsValidDevApiKey(configuration, Request))
            return Unauthorized();

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email && !u.IsDeleted);

        if (user is null)
            return NotFound(new
            {
                message = ErrorConstants.Auth.EmailNotFoundDescriptionTemplate.Format(CurrentLanguage, request.Email),
            });

        user.ChangePassword(hasher.HashPassword(request.NewPassword), "dev-reset");
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = ErrorConstants.Auth.PasswordChangedDescriptionTemplate.Format(CurrentLanguage, user.Email, user.Username),
        });
    }

    /// <summary>DEV ONLY – reset password for all active users.</summary>
    [AllowAnonymous]
    [HttpPost(AuthEndpoint.DevResetAllPasswords)]
    public async Task<IActionResult> DevResetAllPasswords(
        [FromBody] DevResetAllPasswordsRequest request,
        [FromServices] AppDbContext db,
        [FromServices] IPasswordHasher hasher,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IConfiguration configuration)
    {
        if (!env.IsDevelopment() || !configuration.GetValue<bool>("Dev:EnableDevEndpoints"))
            return NotFound();

        if (!IsValidDevApiKey(configuration, Request))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new
            {
                message = ErrorConstants.Auth.NewPasswordRequiredDescription.Resolve(CurrentLanguage),
            });

        var users = await db.Users
            .Where(u => !u.IsDeleted)
            .ToListAsync();

        var hashedPassword = hasher.HashPassword(request.NewPassword);
        foreach (var user in users)
        {
            user.ChangePassword(hashedPassword, "dev-reset-all");
        }

        await db.SaveChangesAsync();

        return Ok(new
        {
            message = ErrorConstants.Auth.PasswordChangedForAccountsDescriptionTemplate.Format(CurrentLanguage, users.Count),
        });
    }

    [AllowAnonymous]
    [HttpGet(AuthEndpoint.GoogleLogin)]
    public IActionResult GoogleLogin([FromServices] IConfiguration configuration, [FromQuery] string? returnUrl = null)
    {
        if (!IsGoogleConfigured(configuration))
            return Redirect(GetFrontendUrl(configuration) + "/auth/callback?error=google_auth_not_configured");

        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(GoogleCallback))
        };

        if (!string.IsNullOrEmpty(returnUrl))
        {
            properties.Items.Add("returnUrl", returnUrl);
        }

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [AllowAnonymous]
    [HttpGet(AuthEndpoint.GoogleCallback)]
    public async Task<IActionResult> GoogleCallback([FromServices] IConfiguration configuration)
    {
        var frontendUrl = GetFrontendUrl(configuration);
        var authenticateResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        if (!authenticateResult.Succeeded)
            return Redirect(frontendUrl + "/auth/callback?error=google_auth_failed");

        var claims = authenticateResult.Principal?.Claims.ToList() ?? [];
        var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var fullName = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
        var picture = claims.FirstOrDefault(c => c.Type == "picture")?.Value
                   ?? claims.FirstOrDefault(c => c.Type == ClaimTypes.Uri)?.Value;

        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
        {
            try { AuthCookieWriter.ClearAuthCookies(Response, Request.IsHttps); } catch (InvalidOperationException) { }
            return Redirect(frontendUrl + "/auth/callback?error=missing_claims");
        }

        var result = await Sender.Send(new ExternalLoginCommand(googleId, email, fullName ?? "", picture));

        // Sign out the cookie used during the OAuth flow
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        if (result.IsError)
        {
            try { AuthCookieWriter.ClearAuthCookies(Response, Request.IsHttps); } catch (InvalidOperationException) { }
            return Redirect(frontendUrl + "/auth/callback?error=login_failed");
        }

        var response = result.Value;
        AuthCookieWriter.WriteAuthCookies(Response, response, Request.IsHttps, jwtOptions.Value);

        var returnUrl = authenticateResult.Properties?.Items.TryGetValue("returnUrl", out var url) == true ? url : null;
        var redirectUrl = $"{frontendUrl}/auth/callback";
        if (!string.IsNullOrEmpty(returnUrl))
        {
            redirectUrl += $"?returnUrl={Uri.EscapeDataString(returnUrl)}";
        }
        return Redirect(redirectUrl);
    }

    private static string GetFrontendUrl(IConfiguration configuration)
    {
        var configuredFrontendUrl = configuration["AppConfig:FrontendBaseUrl"];
        if (!string.IsNullOrWhiteSpace(configuredFrontendUrl))
        {
            return configuredFrontendUrl.TrimEnd('/');
        }

        var firstAllowedOrigin = configuration
            .GetSection("Cors:AllowedOrigins")
            .GetChildren()
            .Select(child => child.Value)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

        if (!string.IsNullOrWhiteSpace(firstAllowedOrigin))
        {
            return firstAllowedOrigin.TrimEnd('/');
        }

        throw new InvalidOperationException(
            "Frontend redirect URL is not configured. Set AppConfig:FrontendBaseUrl or Cors:AllowedOrigins.");
    }

    private static bool IsGoogleConfigured(IConfiguration configuration)
    {
        return !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientId"]) &&
               !string.IsNullOrWhiteSpace(configuration["Authentication:Google:ClientSecret"]);
    }

    private static bool IsValidDevApiKey(IConfiguration configuration, HttpRequest request)
    {
        var configuredKey = configuration["Dev:DevApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey))
            return false;

        var providedKey = request.Headers["X-Dev-Api-Key"].FirstOrDefault();
        return !string.IsNullOrEmpty(providedKey) && configuredKey == providedKey;
    }
}

public sealed record DevResetPasswordRequest(string Email, string NewPassword);
public sealed record DevResetAllPasswordsRequest(string NewPassword);
