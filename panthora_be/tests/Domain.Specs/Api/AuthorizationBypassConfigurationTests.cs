using Api.Configuration;
using Microsoft.Extensions.Configuration;

namespace Domain.Specs.Api;

public sealed class AuthorizationBypassConfigurationTests
{
    [Fact]
    public void IsAuthorizationDisabled_WhenConfigValueIsTrue_ShouldReturnTrue()
    {
        var values = new Dictionary<string, string?>
        {
            ["Auth:DisableAuthorization"] = "true"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        var result = configuration.IsAuthorizationDisabled();

        Assert.True(result);
    }

    [Fact]
    public void IsAuthorizationDisabled_WhenConfigIsMissing_ShouldReturnFalse()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var result = configuration.IsAuthorizationDisabled();

        Assert.False(result);
    }
}
