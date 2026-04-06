using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

[Authorize]
public class NotificationsHub : Hub
{
    private readonly IHubContext<NotificationsHub> _hubContext;
    private readonly ILogger<NotificationsHub> _logger;

    public NotificationsHub(
        IHubContext<NotificationsHub> hubContext,
        ILogger<NotificationsHub> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isAdmin = Context.User?.IsInRole("Admin") ?? false;

        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to their personal group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
            _logger.LogInformation("User {UserId} connected to notifications hub", userId);
        }

        if (isAdmin)
        {
            // Add admin to admin group
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
            _logger.LogInformation("Admin user connected to notifications hub");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");
            _logger.LogInformation("User {UserId} disconnected from notifications hub", userId);
        }

        var isAdmin = Context.User?.IsInRole("Admin") ?? false;
        if (isAdmin)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, "admins");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Send notification to a specific user
    /// </summary>
    public async Task SendNotificationToUser(string userId, object notification)
    {
        await _hubContext.Clients.Group($"user:{userId}").SendAsync("ReceiveNotification", notification);
        _logger.LogDebug("Notification sent to user {UserId}", userId);
    }

    /// <summary>
    /// Send notification to all connected admins
    /// </summary>
    public async Task SendNotificationToAdmins(object notification)
    {
        await _hubContext.Clients.Group("admins").SendAsync("ReceiveNotification", notification);
        _logger.LogDebug("Notification sent to all admins");
    }

    /// <summary>
    /// Send booking update to a specific user
    /// </summary>
    public async Task SendBookingUpdateToUser(string userId, object bookingUpdate)
    {
        await _hubContext.Clients.Group($"user:{userId}").SendAsync("ReceiveBookingUpdate", bookingUpdate);
        _logger.LogDebug("Booking update sent to user {UserId}", userId);
    }

    /// <summary>
    /// Send booking update to all connected admins
    /// </summary>
    public async Task SendBookingUpdateToAdmins(object bookingUpdate)
    {
        await _hubContext.Clients.Group("admins").SendAsync("ReceiveBookingUpdate", bookingUpdate);
        _logger.LogDebug("Booking update sent to all admins");
    }

    /// <summary>
    /// Send tour instance status update to admins
    /// </summary>
    public async Task SendTourInstanceUpdateToAdmins(object update)
    {
        await _hubContext.Clients.Group("admins").SendAsync("ReceiveTourInstanceUpdate", update);
        _logger.LogDebug("Tour instance update sent to all admins");
    }

    /// <summary>
    /// Phase 4.1.1: Send payment update to a specific user
    /// </summary>
    public async Task SendPaymentUpdateToUser(string userId, object paymentUpdate)
    {
        await _hubContext.Clients.Group($"user:{userId}").SendAsync("ReceivePaymentUpdate", paymentUpdate);
        _logger.LogDebug("Payment update sent to user {UserId}", userId);
    }

    /// <summary>
    /// Phase 4.1.2: Send payment update to all connected admins
    /// </summary>
    public async Task SendPaymentUpdateToAdmins(object paymentUpdate)
    {
        await _hubContext.Clients.Group("admins").SendAsync("ReceivePaymentUpdate", paymentUpdate);
        _logger.LogDebug("Payment update sent to all admins");
    }
}
