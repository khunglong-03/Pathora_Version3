using Application.Common.Constant;
using Application.Common.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Queries;

public sealed record GetMyCancellationRequestsQuery(
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("status")] BookingCancellationRequestStatus? Status = null)
    : IQuery<ErrorOr<MyCancellationRequestsResult>>;

public sealed record MyCancellationRequestsResult(
    List<MyCancellationRequestDto> Items,
    int TotalCount);

public sealed record MyCancellationRequestDto(
    Guid RequestId,
    Guid BookingId,
    BookingCancellationRequestStatus Status,
    string StatusLabel,
    int FeePercent,
    decimal PaidAmountSnapshot,
    decimal RefundAmount,
    int DaysBeforeDeparture,
    string CustomerReason,
    string? ManagerNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset? RefundConfirmedAt);

public sealed class GetMyCancellationRequestsQueryHandler(
    IBookingCancellationRequestRepository cancellationRequestRepository,
    ICurrentUser currentUser)
    : IQueryHandler<GetMyCancellationRequestsQuery, ErrorOr<MyCancellationRequestsResult>>
{
    public async Task<ErrorOr<MyCancellationRequestsResult>> Handle(
        GetMyCancellationRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (!currentUserId.HasValue)
            return Error.Unauthorized(BookingCancellationErrors.NotOwnerCode,
                BookingCancellationErrors.NotOwnerDescription.Vi);

        var (items, totalCount) = await cancellationRequestRepository.GetPagedByUserIdAsync(
            currentUserId.Value,
            request.Status,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(r => new MyCancellationRequestDto(
            RequestId: r.Id,
            BookingId: r.BookingId,
            Status: r.Status,
            StatusLabel: r.Status switch
            {
                BookingCancellationRequestStatus.PendingManagerReview => "Đang chờ duyệt",
                BookingCancellationRequestStatus.Approved => "Đã duyệt",
                BookingCancellationRequestStatus.Rejected => "Đã từ chối",
                _ => r.Status.ToString()
            },
            FeePercent: r.FeePercent,
            PaidAmountSnapshot: r.PaidAmountSnapshot,
            RefundAmount: r.RefundAmount,
            DaysBeforeDeparture: r.DaysBeforeDeparture,
            CustomerReason: r.CustomerReason,
            ManagerNote: r.ManagerNote,
            CreatedAt: r.CreatedAt,
            ReviewedAt: r.ReviewedAt,
            RefundConfirmedAt: r.RefundConfirmedAt
        )).ToList();

        return new MyCancellationRequestsResult(dtos, totalCount);
    }
}
