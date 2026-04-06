using Contracts.ModelResponse;
using ErrorOr;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace Domain.Specs.Api;

internal static class ApiControllerTestHelper
{
    /// <summary>
    /// For controllers with a parameterless constructor.
    /// </summary>
    internal static (TController Controller, RequestProbe<TRequest, TResponse> Probe) BuildController<TController, TRequest, TResponse>(
        ErrorOr<TResponse> response,
        string path)
        where TController : ControllerBase, new()
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        var services = new ServiceCollection();
        var probe = new RequestProbe<TRequest, TResponse>(response);
        services.AddSingleton(probe);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RequestProbeHandler<TRequest, TResponse>>());
        services.AddTransient<IRequestHandler<TRequest, ErrorOr<TResponse>>, RequestProbeHandler<TRequest, TResponse>>();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

        var controller = new TController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = httpContext
            }
        };

        return (controller, probe);
    }

    /// <summary>
    /// For controllers with primary-constructor dependencies (no parameterless ctor).
    /// Pass extra constructor arguments after path.
    /// </summary>
    internal static (TController Controller, RequestProbe<TRequest, TResponse> Probe) BuildController<TController, TRequest, TResponse>(
        ErrorOr<TResponse> response,
        string path,
        params object[] ctorArgs)
        where TController : ControllerBase
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        var services = new ServiceCollection();
        var probe = new RequestProbe<TRequest, TResponse>(response);
        services.AddSingleton(probe);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RequestProbeHandler<TRequest, TResponse>>());
        services.AddTransient<IRequestHandler<TRequest, ErrorOr<TResponse>>, RequestProbeHandler<TRequest, TResponse>>();

        var httpContext = new DefaultHttpContext
        {
            RequestServices = services.BuildServiceProvider()
        };
        httpContext.Request.Path = path;

        var controller = (TController)Activator.CreateInstance(typeof(TController), ctorArgs)!;
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return (controller, probe);
    }

    /// <summary>
    /// For controllers with primary-constructor dependencies AND a custom HttpContext.
    /// Use this when testing response-committed scenarios.
    /// </summary>
    internal static (TController Controller, RequestProbe<TRequest, TResponse> Probe) BuildController<TController, TRequest, TResponse>(
        ErrorOr<TResponse> response,
        string path,
        HttpContext context,
        params object[] ctorArgs)
        where TController : ControllerBase
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        var services = new ServiceCollection();
        var probe = new RequestProbe<TRequest, TResponse>(response);
        services.AddSingleton(probe);
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<RequestProbeHandler<TRequest, TResponse>>());
        services.AddTransient<IRequestHandler<TRequest, ErrorOr<TResponse>>, RequestProbeHandler<TRequest, TResponse>>();

        context.RequestServices = services.BuildServiceProvider();
        context.Request.Path = path;

        var controller = (TController)Activator.CreateInstance(typeof(TController), ctorArgs)!;
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = context
        };

        return (controller, probe);
    }

    internal static void AssertSuccessResponse<T>(
        IActionResult actionResult,
        int expectedStatusCode,
        string expectedInstance,
        T expectedData,
        string expectedMessage = "Thành công")
    {
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(expectedStatusCode, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<T>>(objectResult.Value);
        Assert.Equal(expectedStatusCode, payload.StatusCode);
        Assert.Equal(expectedInstance, payload.Instance);
        Assert.Equal(expectedMessage, payload.Message);
        Assert.Equal(expectedData, payload.Data);
    }

    internal static void AssertErrorResponse(
        IActionResult actionResult,
        int expectedStatusCode,
        string expectedCode,
        string expectedMessage,
        string expectedInstance)
    {
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(expectedStatusCode, objectResult.StatusCode);

        var payload = Assert.IsType<ResultSharedResponse<object>>(objectResult.Value);
        Assert.Equal(expectedStatusCode, payload.StatusCode);
        Assert.Equal(expectedInstance, payload.Instance);
        Assert.Equal(expectedMessage, payload.Message);
        Assert.NotNull(payload.Errors);
        Assert.Single(payload.Errors);
        Assert.Equal(expectedMessage, payload.Errors[0].ErrorMessage);
        Assert.Equal(expectedCode, payload.Errors[0].Details);
    }

    internal sealed class RequestProbe<TRequest, TResponse>(ErrorOr<TResponse> response)
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public ErrorOr<TResponse> Response { get; } = response;
        public TRequest? CapturedRequest { get; set; }
    }

    private sealed class RequestProbeHandler<TRequest, TResponse>(RequestProbe<TRequest, TResponse> probe)
        : IRequestHandler<TRequest, ErrorOr<TResponse>>
        where TRequest : IRequest<ErrorOr<TResponse>>
    {
        public Task<ErrorOr<TResponse>> Handle(TRequest request, CancellationToken cancellationToken)
        {
            probe.CapturedRequest = request;
            return Task.FromResult(probe.Response);
        }
    }
}
