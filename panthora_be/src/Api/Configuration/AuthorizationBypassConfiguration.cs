using Microsoft.Extensions.Configuration;

namespace Api.Configuration;

public static class AuthorizationBypassConfiguration
{
    public static bool IsAuthorizationDisabled(this IConfiguration configuration)
    {
        return configuration.GetValue<bool>("Auth:DisableAuthorization");
    }
}
