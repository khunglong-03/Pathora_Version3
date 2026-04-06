namespace Application.Features.Tour.Commands.PurgeTour;

public enum PurgeResult
{
    Success,
    NotFound
}

public interface ITourPurgeExecutor
{
    Task<PurgeResult> ExecuteAsync(Guid tourId, CancellationToken cancellationToken = default);
}
