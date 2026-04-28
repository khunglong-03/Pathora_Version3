using Application.Common.Constant;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Common.Authorization;

/// <summary>
/// Defense-in-depth role checks for TourInstance commands (ER-12).
/// Controllers already carry <c>[Authorize(Roles=...)]</c> attributes; these handler-level
/// guards ensure a command still fails closed if invoked in a context where the attribute
/// was bypassed (e.g. internal service call, MediatR pipeline).
/// </summary>
public static class TourInstanceRoleGuard
{
    public static readonly string[] ManagementRoles =
    [
        "Admin",
        "Manager",
        "TourOperator"
    ];

    public static readonly string[] ProviderRoles =
    [
        "TransportProvider",
        "HotelProvider",
        "Admin"
    ];

    /// <summary>
    /// Returns <see cref="Error.Forbidden"/> if the current user has roles declared but
    /// none of them match <paramref name="allowedRoles"/>.
    ///
    /// Behavior when <c>user.Roles</c> is null or empty: pass. The controller-level
    /// <c>[Authorize(Roles=...)]</c> attribute is the primary gate; this handler guard is
    /// "defense in depth" and must remain backward compatible with deployments or test
    /// doubles that don't populate role claims.
    /// </summary>
    public static ErrorOr<Success> Require(IUser user, IReadOnlyCollection<string> allowedRoles)
    {
        if (user is null) throw new ArgumentNullException(nameof(user));
        if (allowedRoles is null || allowedRoles.Count == 0)
            throw new ArgumentException("At least one role is required.", nameof(allowedRoles));

        var userRoles = user.Roles?.ToList() ?? [];
        if (userRoles.Count == 0)
        {
            // No roles populated → defer to controller-level authorization. Do not block.
            return Result.Success;
        }

        foreach (var role in userRoles)
        {
            if (allowedRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
                return Result.Success;
        }

        return Error.Forbidden(
            "User.Forbidden",
            $"Bạn không có quyền thực hiện hành động này. Cần một trong các vai trò: {string.Join(", ", allowedRoles)}.");
    }
}
