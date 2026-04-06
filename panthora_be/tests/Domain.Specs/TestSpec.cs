using Contracts.ModelResponse;

namespace Domain.Specs;

public sealed class TestSpec
{
    [Fact]
    public void Success_WithCustomStatusCode_ShouldUseProvidedCode()
    {
        var response = ResultSharedResponse<string>.Success(
            data: "payload",
            message: "Created",
            instance: "/api/resources",
            statusCode: 201);

        Assert.Equal(201, response.StatusCode);
        Assert.Equal("payload", response.Data);
        Assert.Equal("Created", response.Message);
        Assert.Equal("/api/resources", response.Instance);
        Assert.Null(response.Errors);
    }
}
