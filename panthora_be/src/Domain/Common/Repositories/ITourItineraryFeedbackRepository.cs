using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourItineraryFeedbackRepository
{
    Task<TourItineraryFeedbackEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TourItineraryFeedbackEntity>> ListByInstanceAndDayAsync(
        Guid tourInstanceId,
        Guid tourInstanceDayId,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TourItineraryFeedbackEntity>> ListByInstanceAsync(
        Guid tourInstanceId,
        CancellationToken cancellationToken = default);
    Task AddAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default);
}
