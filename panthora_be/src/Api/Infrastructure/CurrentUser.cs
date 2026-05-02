using System.Security.Claims;
using Contracts.Interfaces;

namespace Api.Infrastructure;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : IUser
{
    public string? Id => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
    public string? Username => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name);
    public IEnumerable<string> Roles => httpContextAccessor.HttpContext?.User.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();
}
