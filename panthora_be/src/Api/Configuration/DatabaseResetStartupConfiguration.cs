using Microsoft.Extensions.Configuration;

namespace Api.Configuration;

public static class DatabaseResetStartupConfiguration
{
    private const string ResetAndReseedOnStartupConfigKey = "Dev:ResetAndReseedOnStartup";

    public static bool IsResetAndReseedOnStartupEnabled(this IConfiguration configuration)
    {
        return configuration.GetValue<bool>(ResetAndReseedOnStartupConfigKey);
    }
}
