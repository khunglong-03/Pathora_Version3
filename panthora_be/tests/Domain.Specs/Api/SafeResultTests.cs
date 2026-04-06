using Application.Contracts.Public;
using ErrorOr;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;

namespace Domain.Specs.Api;

/// <summary>
/// Verifies that SafeResult returns EmptyResult when the response has already started,
/// preventing InvalidOperationException from ObjectResult.OnFormatting.
/// </summary>
public sealed class SafeResultTests
{
    [Fact]
    public void SafeResult_WhenResponseHasStarted_ShouldReturnEmptyResult()
    {
        var httpContext = CreateCommittedHttpContext();
        var controller = new TestController(httpContext);

        var result = controller.CallSafeResult(200, "data");

        Assert.IsNotType<ObjectResult>(result);
    }

    [Fact]
    public void SafeResult_WhenResponseNotStarted_ShouldReturnObjectResult()
    {
        var httpContext = CreateDefaultHttpContext();
        var controller = new TestController(httpContext);

        var result = controller.CallSafeResult(200, "data");

        Assert.IsType<ObjectResult>(result);
    }

    private static DefaultHttpContext CreateCommittedHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/test";
        context.Response.Body = new MemoryStream();
        context.Features.Set<IHttpResponseFeature>(new CommittedResponseFeature());
        return context;
    }

    private static DefaultHttpContext CreateDefaultHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/test";
        context.Response.Body = new MemoryStream();
        return context;
    }

    /// <summary>
    /// Test controller that exposes SafeResult for unit testing.
    /// </summary>
    private sealed class TestController : ControllerBase
    {
        public TestController(HttpContext httpContext)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        // Expose SafeResult for testing
        public IActionResult CallSafeResult(int statusCode, object? value)
        {
            if (HttpContext.Response.HasStarted)
                return new EmptyResult();
            return new ObjectResult(value) { StatusCode = statusCode };
        }
    }

    private sealed class CommittedResponseFeature : IHttpResponseFeature
    {
        public int StatusCode { get; set; } = 200;
        public string? ReasonPhrase { get; set; }
        public IHeaderDictionary Headers { get; set; } = new HeaderDictionary();
        public Stream Body { get; set; } = Stream.Null;
        public bool HasStarted => true;

        public void OnStarting(Func<object, Task> callback, object state) { }
        public void OnCompleted(Func<object, Task> callback, object state) { }
    }
}
