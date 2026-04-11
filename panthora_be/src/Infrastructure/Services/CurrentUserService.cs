using System;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Infrastructure.Services;

public sealed class CurrentUserService : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? Id
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return null;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : (Guid?)null;
        }
    }
}
