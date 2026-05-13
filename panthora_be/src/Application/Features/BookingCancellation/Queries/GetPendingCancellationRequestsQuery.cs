using Application.Common.Constant;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Queries;

public sealed record GetPendingCancellationRequestsQuery(
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 20,
    [property: JsonPropertyName("status")] BookingCancellationRequestStatus? Status = null,
    [property: JsonPropertyName("search")] string? Search = null)
    : IQuery<ErrorOr<CancellationRequestListResult>>;

public sealed record CancellationRequestListResult(
    List<CancellationRequestManagerDto> Items,
    int TotalCount);

public sealed record CancellationRequestManagerDto(
    Guid RequestId,
    Guid BookingId,
    BookingCancellationRequestStatus Status,
    string StatusLabel,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string TourName,
    DateTimeOffset? TourStartDate,
    int DaysBeforeDeparture,
    int FeePercent,
    decimal PaidAmountSnapshot,
    decimal RefundAmount,
    string CustomerReason,
    string? ManagerNote,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset? RefundConfirmedAt,
    Guid? ReviewedByManagerId,
    Guid? RefundConfirmedByManagerId);

public sealed class GetPendingCancellationRequestsQueryHandler(
    IBookingCancellationRequestRepository cancellationRequestRepository)
    : IQueryHandler<GetPendingCancellationRequestsQuery, ErrorOr<CancellationRequestListResult>>
{
    public async Task<ErrorOr<CancellationRequestListResult>> Handle(
        GetPendingCancellationRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var (items, totalCount) = await cancellationRequestRepository.GetPagedForManagerAsync(
            request.Status,
            request.Search,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = items.Select(r => new CancellationRequestManagerDto(
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
            CustomerName: r.Booking?.CustomerName ?? string.Empty,
            CustomerPhone: r.Booking?.CustomerPhone ?? string.Empty,
            CustomerEmail: r.Booking?.CustomerEmail,
            TourName: r.Booking?.TourInstance?.TourName ?? string.Empty,
            TourStartDate: r.Booking?.TourInstance?.StartDate,
            DaysBeforeDeparture: r.DaysBeforeDeparture,
            FeePercent: r.FeePercent,
            PaidAmountSnapshot: r.PaidAmountSnapshot,
            RefundAmount: r.RefundAmount,
            CustomerReason: r.CustomerReason,
            ManagerNote: r.ManagerNote,
            CreatedAt: r.CreatedAt,
            ReviewedAt: r.ReviewedAt,
            RefundConfirmedAt: r.RefundConfirmedAt,
            ReviewedByManagerId: r.ReviewedByManagerId,
            RefundConfirmedByManagerId: r.RefundConfirmedByManagerId
        )).ToList();

        return new CancellationRequestListResult(dtos, totalCount);
    }
}
