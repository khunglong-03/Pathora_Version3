using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Tours.Commands;

public sealed class ReviewTourCommandHandler(ITourService tourService)
    : ICommandHandler<ReviewTourCommand, ErrorOr<TourDto>>
{
    public async Task<ErrorOr<TourDto>> Handle(ReviewTourCommand request, CancellationToken cancellationToken)
    {
        return await tourService.ReviewTour(request.TourId, request.Action, request.Reason);
    }
}
