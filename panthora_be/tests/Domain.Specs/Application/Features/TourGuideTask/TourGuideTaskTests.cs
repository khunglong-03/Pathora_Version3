using Application.Features.TourGuideTask.Commands;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Specs.Helpers;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Features.TourGuideTask;

public sealed class TourGuideTaskTests
{
    private static (
        CreateTourGuideTaskCommandHandler createHandler,
        UpdateTourGuideTaskStatusCommandHandler updateStatusHandler,
        ITourGuideTaskRepository taskRepo,
        ITourInstanceRepository tourInstanceRepo,
        IUser user) BuildHandlers(string userId, params string[] roles)
    {
        var taskRepo = Substitute.For<ITourGuideTaskRepository>();
        var tourInstanceRepo = Substitute.For<ITourInstanceRepository>();
        var user = Substitute.For<IUser>();
        user.Id.Returns(userId);
        user.Roles.Returns(roles.Length == 0 ? ["TourOperator"] : roles);

        var createHandler = new CreateTourGuideTaskCommandHandler(taskRepo, tourInstanceRepo, user);
        var updateStatusHandler = new UpdateTourGuideTaskStatusCommandHandler(taskRepo, tourInstanceRepo, user);

        return (createHandler, updateStatusHandler, taskRepo, tourInstanceRepo, user);
    }

    [Fact]
    public async Task CreateTask_WithNonExistentTourInstance_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var (createHandler, _, _, tourInstanceRepo, _) = BuildHandlers(userId);
        var tourInstanceId = Guid.NewGuid();

        tourInstanceRepo.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns((TourInstanceEntity)null!);

        var command = new CreateTourGuideTaskCommand(
            tourInstanceId,
            "Kiểm tra lều trại",
            "Mô tả chi tiết",
            true,
            null);

        // Act
        var result = await createHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourInstance.NotFound");
    }

    [Fact]
    public async Task CreateTask_WithUnassignedGuide_ReturnsValidationError()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var (createHandler, _, _, tourInstanceRepo, _) = BuildHandlers(userId);
        var tourInstanceId = Guid.NewGuid();
        var guideId = Guid.NewGuid();

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Managers = [] // No managers/guides assigned
        };

        tourInstanceRepo.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        var command = new CreateTourGuideTaskCommand(
            tourInstanceId,
            "Kiểm tra lều trại",
            "Mô tả chi tiết",
            true,
            guideId.ToString());

        // Act
        var result = await createHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourGuideTask.GuideNotAssigned");
    }

    [Fact]
    public async Task CreateTask_WithAssignedGuide_SavesAndReturnsTaskId()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var (createHandler, _, taskRepo, tourInstanceRepo, _) = BuildHandlers(userId);
        var tourInstanceId = Guid.NewGuid();
        var guideId = Guid.NewGuid();

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Managers =
            [
                new TourInstanceManagerEntity
                {
                    UserId = guideId,
                    Role = TourInstanceManagerRole.Guide
                }
            ]
        };

        tourInstanceRepo.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>())
            .Returns(tourInstance);

        var command = new CreateTourGuideTaskCommand(
            tourInstanceId,
            "Kiểm tra lều trại",
            "Mô tả chi tiết",
            true,
            guideId.ToString());

        // Act
        var result = await createHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.NotEqual(Guid.Empty, result.Value);
        await taskRepo.Received(1).AddAsync(Arg.Any<TourGuideTaskEntity>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task UpdateStatus_WithNonExistentTask_ReturnsNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var (_, updateHandler, taskRepo, _, _) = BuildHandlers(userId);
        var taskId = Guid.NewGuid();

        taskRepo.GetByIdAsync(taskId, Arg.Any<CancellationToken>())
            .Returns((TourGuideTaskEntity)null!);

        var command = new UpdateTourGuideTaskStatusCommand(
            taskId,
            TourGuideTaskStatus.Completed,
            "Đã xong lều trại",
            ["https://cdn/camp.jpg"]);

        // Act
        var result = await updateHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourGuideTask.NotFound");
    }

    [Fact]
    public async Task UpdateStatus_ByUnassignedGuide_ReturnsForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var (_, updateHandler, taskRepo, tourInstanceRepo, _) = BuildHandlers(userId, "TourGuide");
        var taskId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var task = TourGuideTaskEntity.Create(
            tourInstanceId,
            "Kiểm tra lều trại",
            null,
            true,
            null,
            Guid.NewGuid().ToString());

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Managers = [] // Not assigned as guide
        };

        taskRepo.GetByIdAsync(taskId, Arg.Any<CancellationToken>()).Returns(task);
        tourInstanceRepo.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>()).Returns(tourInstance);

        var command = new UpdateTourGuideTaskStatusCommand(
            taskId,
            TourGuideTaskStatus.Completed,
            "Hoàn thành",
            []);

        // Act
        var result = await updateHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TourGuideTask.Forbidden");
    }

    [Fact]
    public async Task UpdateStatus_ByAssignedGuide_UpdatesTaskSuccessfully()
    {
        // Arrange
        var guideGuid = Guid.NewGuid();
        var guideIdStr = guideGuid.ToString();
        var (_, updateHandler, taskRepo, tourInstanceRepo, _) = BuildHandlers(guideIdStr, "TourGuide");
        var taskId = Guid.NewGuid();
        var tourInstanceId = Guid.NewGuid();

        var task = TourGuideTaskEntity.Create(
            tourInstanceId,
            "Kiểm tra lều trại",
            null,
            true,
            guideIdStr,
            Guid.NewGuid().ToString());

        var tourInstance = new TourInstanceEntity
        {
            Id = tourInstanceId,
            Managers =
            [
                new TourInstanceManagerEntity
                {
                    UserId = guideGuid,
                    Role = TourInstanceManagerRole.Guide
                }
            ]
        };

        taskRepo.GetByIdAsync(taskId, Arg.Any<CancellationToken>()).Returns(task);
        tourInstanceRepo.FindById(tourInstanceId, cancellationToken: Arg.Any<CancellationToken>()).Returns(tourInstance);

        var command = new UpdateTourGuideTaskStatusCommand(
            taskId,
            TourGuideTaskStatus.Completed,
            "Lều trại đã ổn định",
            ["https://cdn/ok.jpg"]);

        // Act
        var result = await updateHandler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsError);
        Assert.Equal(TourGuideTaskStatus.Completed, task.Status);
        Assert.Equal("Lều trại đã ổn định", task.Notes);
        Assert.Single(task.EvidenceImageUrls);
        Assert.Equal("https://cdn/ok.jpg", task.EvidenceImageUrls[0]);
        taskRepo.Received(1).Update(task);
    }
}
