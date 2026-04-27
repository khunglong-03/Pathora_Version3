using Application.Common.Interfaces;
using Application.Contracts.File;
using Application.Features.TourInstance.Commands;
using Application.Services;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using NSubstitute;

namespace Domain.Specs.Application.Features.TourInstance.Commands;

public sealed class UploadTicketImageCommandHandlerTests
{
    private static (
        UploadTicketImageCommandHandler handler,
        ITourInstanceRepository tourInstance,
        IBookingRepository bookings,
        ITicketImageRepository tickets,
        IFileService files,
        IUnitOfWork uow,
        IUser user) BuildHandler(string userId)
    {
        var tourInstance = Substitute.For<ITourInstanceRepository>();
        var bookings = Substitute.For<IBookingRepository>();
        var tickets = Substitute.For<ITicketImageRepository>();
        var files = Substitute.For<IFileService>();
        var uow = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();
        user.Id.Returns(userId);
        user.Roles.Returns(["TourDesigner"]);

        var handler = new UploadTicketImageCommandHandler(
            tourInstance, bookings, tickets, files, uow, user);
        return (handler, tourInstance, bookings, tickets, files, uow, user);
    }

    private static TourInstanceEntity BuildInstanceWithActivity(Guid instanceId, Guid activityId, TransportationType type)
    {
        var day = new TourInstanceDayEntity
        {
            Id = Guid.NewGuid(),
            ActualDate = new DateOnly(2026, 6, 1),
            IsDeleted = false
        };
        var activity = TourInstanceDayActivityEntity.Create(
            day.Id, 1, TourDayActivityType.Transportation, "Flight", "t",
            transportationType: type);
        // Force the Id used by the test.
        typeof(TourInstanceDayActivityEntity).GetProperty(nameof(TourInstanceDayActivityEntity.Id))!.SetValue(activity, activityId);
        activity.TourInstanceDayId = day.Id;
        activity.TourInstanceDay = day;
        day.Activities = [activity];
        return new TourInstanceEntity
        {
            Id = instanceId,
            InstanceDays = [day]
        };
    }

    [Fact]
    public async Task Handle_ExternalTicketActivityWithBooking_UploadsAndReturnsDto()
    {
        var (handler, tourInstance, bookings, tickets, files, uow, _) = BuildHandler(Guid.NewGuid().ToString());
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var instance = BuildInstanceWithActivity(instanceId, activityId, TransportationType.Flight);
        tourInstance.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        bookings.CountByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>()).Returns(1);
        files.UploadFileAsync(Arg.Any<UploadFileRequest>())
            .Returns(new FileMetadataVm(Guid.NewGuid(), "https://cdn/x.jpg", "x.jpg", "image/jpeg", 1024));

        using var stream = new MemoryStream(new byte[8]);
        var cmd = new UploadTicketImageCommand(
            instanceId, activityId, stream, "ticket.jpg", "image/jpeg", 1024, null, "VN-1", null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.False(result.IsError);
        await tickets.Received(1).AddAsync(Arg.Any<TicketImageEntity>(), Arg.Any<CancellationToken>());
        await uow.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_GroundActivity_RejectedWithActivityNotExternal()
    {
        var (handler, tourInstance, bookings, tickets, files, uow, _) = BuildHandler(Guid.NewGuid().ToString());
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var instance = BuildInstanceWithActivity(instanceId, activityId, TransportationType.Bus);
        tourInstance.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);

        using var stream = new MemoryStream(new byte[8]);
        var cmd = new UploadTicketImageCommand(
            instanceId, activityId, stream, "x.jpg", "image/jpeg", 1024, null, null, null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TicketImage.ActivityNotExternal");
        await tickets.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
        await files.DidNotReceiveWithAnyArgs().UploadFileAsync(default!);
    }

    [Fact]
    public async Task Handle_NoBookings_RejectedWithNoBookings()
    {
        var (handler, tourInstance, bookings, tickets, files, _, _) = BuildHandler(Guid.NewGuid().ToString());
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var instance = BuildInstanceWithActivity(instanceId, activityId, TransportationType.Flight);
        tourInstance.FindByIdWithInstanceDays(instanceId, Arg.Any<CancellationToken>()).Returns(instance);
        bookings.CountByTourInstanceIdAsync(instanceId, Arg.Any<CancellationToken>()).Returns(0);

        using var stream = new MemoryStream(new byte[8]);
        var cmd = new UploadTicketImageCommand(
            instanceId, activityId, stream, "x.jpg", "image/jpeg", 1024, null, null, null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TicketImage.NoBookings");
        await tickets.DidNotReceiveWithAnyArgs().AddAsync(default!, default);
    }

    [Fact]
    public async Task Handle_InvalidMimeType_Rejected()
    {
        var (handler, tourInstance, bookings, tickets, files, _, _) = BuildHandler(Guid.NewGuid().ToString());
        var instanceId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        using var stream = new MemoryStream(new byte[8]);
        var cmd = new UploadTicketImageCommand(
            instanceId, activityId, stream, "doc.pdf", "application/pdf", 1024, null, null, null);

        var result = await handler.Handle(cmd, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TicketImage.InvalidFileType");
        await tourInstance.DidNotReceiveWithAnyArgs().FindByIdWithInstanceDays(default!, default);
    }
}

public sealed class DeleteTicketImageCommandHandlerTests
{
    private static (
        DeleteTicketImageCommandHandler handler,
        ITicketImageRepository tickets,
        IFileService files,
        IUnitOfWork uow,
        IUser user) BuildHandler(string userId, params string[] roles)
    {
        var tickets = Substitute.For<ITicketImageRepository>();
        var files = Substitute.For<IFileService>();
        var uow = Substitute.For<IUnitOfWork>();
        var user = Substitute.For<IUser>();
        user.Id.Returns(userId);
        user.Roles.Returns(roles.Length == 0 ? ["TourDesigner"] : roles);

        return (new DeleteTicketImageCommandHandler(tickets, files, uow, user), tickets, files, uow, user);
    }

    [Fact]
    public async Task Handle_ImageBelongsToDifferentActivity_ReturnsNotFound()
    {
        var userId = Guid.NewGuid().ToString();
        var (handler, tickets, _, _, _) = BuildHandler(userId);
        var imageId = Guid.NewGuid();
        var entity = TicketImageEntity.Create(
            tourInstanceDayActivityId: Guid.NewGuid(),
            image: new ImageEntity(),
            uploadedBy: userId);
        typeof(TicketImageEntity).GetProperty(nameof(TicketImageEntity.Id))!.SetValue(entity, imageId);
        tickets.FindByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(entity);

        var differentActivityId = Guid.NewGuid();
        var result = await handler.Handle(new DeleteTicketImageCommand(differentActivityId, imageId), CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TicketImage.NotFound");
    }

    [Fact]
    public async Task Handle_NotUploaderNoManagerRole_ReturnsForbidden()
    {
        var userId = Guid.NewGuid().ToString();
        var anotherUploader = Guid.NewGuid().ToString();
        var (handler, tickets, _, _, _) = BuildHandler(userId, "TourDesigner");
        var activityId = Guid.NewGuid();
        var imageId = Guid.NewGuid();
        var entity = TicketImageEntity.Create(
            tourInstanceDayActivityId: activityId,
            image: new ImageEntity(),
            uploadedBy: anotherUploader);
        typeof(TicketImageEntity).GetProperty(nameof(TicketImageEntity.Id))!.SetValue(entity, imageId);
        tickets.FindByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(entity);

        var result = await handler.Handle(new DeleteTicketImageCommand(activityId, imageId), CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Contains(result.Errors, e => e.Code == "TicketImage.DeleteForbidden");
    }

    [Fact]
    public async Task Handle_UploaderDeletes_Succeeds()
    {
        var userId = Guid.NewGuid().ToString();
        var (handler, tickets, _, uow, _) = BuildHandler(userId, "TourDesigner");
        var activityId = Guid.NewGuid();
        var imageId = Guid.NewGuid();
        var entity = TicketImageEntity.Create(
            tourInstanceDayActivityId: activityId,
            image: new ImageEntity(),
            uploadedBy: userId);
        typeof(TicketImageEntity).GetProperty(nameof(TicketImageEntity.Id))!.SetValue(entity, imageId);
        tickets.FindByIdAsync(imageId, Arg.Any<CancellationToken>()).Returns(entity);

        var result = await handler.Handle(new DeleteTicketImageCommand(activityId, imageId), CancellationToken.None);

        Assert.False(result.IsError);
        tickets.Received(1).Delete(entity);
        await uow.Received(1).SaveChangeAsync(Arg.Any<CancellationToken>());
    }
}
