using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TourGuideTask.Queries;

public sealed record GetTourGuideTasksQuery(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId) : IQuery<ErrorOr<List<TourGuideTaskDto>>>;

public sealed class GetTourGuideTasksQueryHandler(
    ITourGuideTaskRepository tourGuideTaskRepository,
    ITourInstanceRepository tourInstanceRepository,
    IUserRepository userRepository,
    IUser user) : IQueryHandler<GetTourGuideTasksQuery, ErrorOr<List<TourGuideTaskDto>>>
{
    private readonly ITourGuideTaskRepository _tourGuideTaskRepository = tourGuideTaskRepository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IUser _user = user;

    public async Task<ErrorOr<List<TourGuideTaskDto>>> Handle(GetTourGuideTasksQuery request, CancellationToken cancellationToken)
    {
        var tourInstance = await _tourInstanceRepository.FindById(request.TourInstanceId, cancellationToken: cancellationToken);
        if (tourInstance is null)
        {
            return Error.NotFound("TourInstance.NotFound", "Không tìm thấy lịch trình tour được yêu cầu.");
        }

        // Authorize access
        var isAdminOrManager = _user.Roles.Any(r =>
            string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(r, "Operator", StringComparison.OrdinalIgnoreCase));

        var userId = _user.Id ?? string.Empty;

        if (!isAdminOrManager)
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return Error.Unauthorized("TourGuideTask.Unauthorized", "Không thể xác định danh tính.");
            }

            // For Guides, they must be assigned to this tour instance
            var isGuideAssigned = tourInstance.Managers.Any(m => 
                m.UserId == userGuid && m.Role == TourInstanceManagerRole.Guide);

            if (!isGuideAssigned)
            {
                return Error.Forbidden("TourGuideTask.Forbidden", "Bạn không có quyền truy cập nhiệm vụ của chuyến đi này.");
            }
        }

        var tasks = await _tourGuideTaskRepository.GetByTourInstanceIdAsync(request.TourInstanceId, cancellationToken);

        // Fetch Usernames for AssignedGuideId and CompletedBy
        var guideIds = tasks
            .Select(t => t.AssignedGuideId)
            .Concat(tasks.Select(t => t.CompletedBy))
            .Where(id => !string.IsNullOrEmpty(id))
            .Select(id => Guid.TryParse(id, out var g) ? g : Guid.Empty)
            .Where(g => g != Guid.Empty)
            .Distinct()
            .ToList();

        var users = guideIds.Count > 0 
            ? await _userRepository.FindByIds(guideIds, cancellationToken)
            : new List<UserEntity>();

        var userDict = users.ToDictionary(u => u.Id.ToString(), u => u.FullName ?? u.Username);

        var dtos = tasks.Select(t => new TourGuideTaskDto(
            t.Id,
            t.TourInstanceId,
            t.AssignedGuideId,
            t.AssignedGuideId != null && userDict.TryGetValue(t.AssignedGuideId, out var guideName) ? guideName : null,
            t.Title,
            t.Description,
            t.IsMandatory,
            t.Status.ToString(),
            t.CompletedAt,
            t.CompletedBy,
            t.CompletedBy != null && userDict.TryGetValue(t.CompletedBy, out var completedByName) ? completedByName : null,
            t.Notes,
            t.EvidenceImageUrls
        )).ToList();

        return dtos;
    }
}
