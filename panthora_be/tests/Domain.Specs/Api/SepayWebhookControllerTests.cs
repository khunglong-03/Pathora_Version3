using System.Net;
using System.Text.Json;

using global::Api.Controllers;
using global::Application.Contracts.Payment;
using global::Application.Options;
using global::Application.Services;
using ErrorOr;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NSubstitute;

namespace Domain.Specs.Api;

public sealed class SepayWebhookControllerTests
{
    private readonly IPaymentReconciliationService _paymentReconciliationService = Substitute.For<IPaymentReconciliationService>();
    private readonly ILogger<SepayWebhookController> _logger = Substitute.For<ILogger<SepayWebhookController>>();

    [Fact]
    public async Task ReceiveWebhook_WhenApiKeyConfiguredAndAuthorizationHeaderMissing_ShouldReturnUnauthorized()
    {
        // Arrange
        var controller = BuildController(new SePayOptions { ApiKey = "secret-123" });

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<UnauthorizedObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        await _paymentReconciliationService
            .DidNotReceive()
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), Arg.Any<string>());
    }

    [Fact]
    public async Task ReceiveWebhook_WhenAuthorizationHeaderIsNotBearer_ShouldReturnUnauthorized()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers.Authorization = "Basic secret-123";

        var controller = BuildController(
            new SePayOptions { ApiKey = "secret-123" },
            httpContext);

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<UnauthorizedObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        await _paymentReconciliationService
            .DidNotReceive()
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), Arg.Any<string>());
    }

    [Fact]
    public async Task ReceiveWebhook_WhenBearerTokenDoesNotMatch_ShouldReturnUnauthorized()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers.Authorization = "Bearer wrong-token";

        var controller = BuildController(
            new SePayOptions { ApiKey = "secret-123" },
            httpContext);

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<UnauthorizedObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, objectResult.StatusCode);
        await _paymentReconciliationService
            .DidNotReceive()
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), Arg.Any<string>());
    }

    [Fact]
    public async Task ReceiveWebhook_WhenAllowListConfiguredAndCallerIpRejected_ShouldReturnForbidden()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("203.0.113.10");
        httpContext.Request.Headers.Authorization = "Bearer secret-123";

        var controller = BuildController(
            new SePayOptions
            {
                ApiKey = "secret-123",
                AllowedIps = "198.51.100.25"
            },
            httpContext);

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status403Forbidden, objectResult.StatusCode);
        await _paymentReconciliationService
            .DidNotReceive()
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), Arg.Any<string>());
    }

    [Fact]
    public async Task ReceiveWebhook_WhenForwardedForMatchesAllowList_ShouldUseForwardedIpAndReturnSuccess()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("203.0.113.10");
        httpContext.Request.Headers.Authorization = "Bearer secret-123";
        httpContext.Request.Headers["X-Forwarded-For"] = "198.51.100.25, 10.10.10.10";

        _paymentReconciliationService.ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), "sepay-webhook")
            .Returns(Task.FromResult<ErrorOr<PaymentStatusSnapshot>>(new PaymentStatusSnapshot(
                "PAY-001",
                "paid",
                "Completed",
                "sepay-webhook",
                true,
                true,
                DateTimeOffset.UtcNow,
                "sepay-1")));

        var controller = BuildController(
            new SePayOptions
            {
                ApiKey = "secret-123",
                AllowedIps = "198.51.100.25"
            },
            httpContext);

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<OkObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);
        await _paymentReconciliationService
            .Received(1)
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), "sepay-webhook");
    }

    [Fact]
    public async Task ReceiveWebhook_WhenValidatedAndInbound_ShouldReturnSuccess()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("198.51.100.25");
        httpContext.Request.Headers.Authorization = "Bearer secret-123";

        _paymentReconciliationService.ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), "sepay-webhook")
            .Returns(Task.FromResult<ErrorOr<PaymentStatusSnapshot>>(new PaymentStatusSnapshot(
                "PAY-001",
                "paid",
                "Completed",
                "sepay-webhook",
                true,
                true,
                DateTimeOffset.UtcNow,
                "sepay-1")));

        var controller = BuildController(
            new SePayOptions
            {
                ApiKey = "secret-123",
                AllowedIps = "198.51.100.25"
            },
            httpContext);

        // Act
        var actionResult = await controller.ReceiveWebhook(CreateInboundRequest(), CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<OkObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status200OK, objectResult.StatusCode);
        Assert.Contains("\"success\":true", JsonSerializer.Serialize(objectResult.Value));
        await _paymentReconciliationService
            .Received(1)
            .ReconcileProviderCallbackAsync(Arg.Any<SepayTransactionData>(), "sepay-webhook");
    }

    private SepayWebhookController BuildController(SePayOptions options, HttpContext? httpContext = null)
    {
        var controller = new SepayWebhookController(
            _paymentReconciliationService,
            Microsoft.Extensions.Options.Options.Create(options),
            _logger);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext ?? new DefaultHttpContext()
        };

        return controller;
    }

    private static SepayWebhookRequest CreateInboundRequest()
        => new()
        {
            Id = 123456,
            Gateway = "MBBank",
            TransactionDate = "2026-04-19 10:00:00",
            AccountNumber = "0123456789",
            Content = "PAY-001|240419ABCD|Booking",
            TransferType = "in",
            TransferAmount = 1500000,
            ReferenceNumber = "MBVCB.123456789"
        };
}
