using global::Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using System.Reflection;

namespace Domain.Specs.Api;

/// <summary>
/// Compile-time authorization checks for the manager-cancel-cascade flow.
/// Verifies that role restrictions on ChangeStatus and refund-status endpoints
/// match the spec (Admin/Manager only). Catches accidental authorization
/// loosening in code review without needing a running API.
/// </summary>
public sealed class CancelTourAuthorizationTests
{
    [Fact]
    public void TourInstance_ChangeStatus_RestrictedToAdminAndManagerRoles()
    {
        var method = typeof(TourInstanceController).GetMethod(nameof(TourInstanceController.ChangeStatus));

        Assert.NotNull(method);
        var authorize = method!.GetCustomAttributes<AuthorizeAttribute>(inherit: true).Single();
        Assert.NotNull(authorize.Roles);

        var roles = authorize.Roles!.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        Assert.Contains("Admin", roles);
        Assert.Contains("Manager", roles);
        Assert.DoesNotContain("TourOperator", roles);
        Assert.DoesNotContain("Customer", roles);
        Assert.DoesNotContain("TransportProvider", roles);
        Assert.DoesNotContain("HotelProvider", roles);
    }

    [Fact]
    public void BookingCancellation_UpdateRefundStatus_RestrictedToManagerPolicy()
    {
        var method = typeof(BookingCancellationController).GetMethod(nameof(BookingCancellationController.UpdateRefundStatus));

        Assert.NotNull(method);
        var authorize = method!.GetCustomAttributes<AuthorizeAttribute>(inherit: true).Single();
        Assert.Equal("ManagerOnly", authorize.Policy);
    }
}
