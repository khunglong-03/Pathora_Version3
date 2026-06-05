using Domain.Entities;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public class BookingDetailDto
{
    public Guid Id { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Tier { get; set; } = "standard";
    public string Status { get; set; } = string.Empty;
    public string TourStatus { get; set; } = string.Empty;
    public Guid TourInstanceId { get; set; }
    public bool IsVisaRequired { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public DateTimeOffset BookingDate { get; set; }
    public DateTimeOffset DepartureDate { get; set; }
    public DateTimeOffset ReturnDate { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public int Infants { get; set; }
    public decimal PricePerPerson { get; set; }
    public decimal AdultPrice { get; set; }
    public decimal ChildPrice { get; set; }
    public decimal InfantPrice { get; set; }
    public decimal AdultSubtotal { get; set; }
    public decimal ChildSubtotal { get; set; }
    public decimal InfantSubtotal { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance { get; set; }
    public decimal VisaServiceFeeTotal { get; set; }
    public bool IsVisaFeePending { get; set; }
    public string BookingType { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Highlights { get; set; } = [];
    public List<string> ImportantInfo { get; set; } = [];
    public string? PendingTransactionCode { get; set; }
    public List<PendingTransactionDto> PendingTransactions { get; set; } = [];
    public BookingCancellationRequestSummaryDto? CancellationRequest { get; set; }
    public List<BookingCancellationRequestSummaryDto> CancellationRequests { get; set; } = [];
    public string? RefundStatus { get; set; }
    public decimal? RefundOutstandingAmount { get; set; }
    public DateTimeOffset? RefundContactedAt { get; set; }
    public DateTimeOffset? RefundCompletedAt { get; set; }
    public DateTimeOffset? ApprovalDeadline { get; set; }
    public DateTimeOffset? ApprovalWarningSentAt { get; set; }
    public DateTimeOffset? ApprovalAutoCancelledAt { get; set; }

    public List<CustomerTicketDto> Tickets { get; set; } = [];
    public List<CustomerRoomAssignmentDto> RoomAssignments { get; set; } = [];
    public List<CustomerDayStatusDto> DayStatuses { get; set; } = [];
    public List<CustomerTicketImageDto> TicketImages { get; set; } = [];
}

public class PendingTransactionDto
{
    public string TransactionCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
}

public class BookingCancellationRequestSummaryDto
{
    public Guid RequestId { get; set; }
    public string Status { get; set; } = string.Empty;
    public int FeePercent { get; set; }
    public decimal PaidAmountSnapshot { get; set; }
    public decimal RefundAmount { get; set; }
    public string? ManagerNote { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset? RefundConfirmedAt { get; set; }
}

public class CustomerTicketDto
{
    public Guid Id { get; set; }
    public Guid TourInstanceDayActivityId { get; set; }
    public string? FlightNumber { get; set; }
    public DateTimeOffset? DepartureAt { get; set; }
    public DateTimeOffset? ArrivalAt { get; set; }
    public string? SeatNumbers { get; set; }
    public string? ETicketNumbers { get; set; }
    public string? SeatClass { get; set; }
    public string? Note { get; set; }
}

public class CustomerRoomAssignmentDto
{
    public Guid Id { get; set; }
    public Guid TourInstanceDayActivityId { get; set; }
    public string RoomType { get; set; } = string.Empty;
    public int RoomCount { get; set; }
    public string? RoomNumbers { get; set; }
    public string? Note { get; set; }
}

public class CustomerDayStatusDto
{
    public Guid Id { get; set; }
    public Guid TourDayId { get; set; }
    public string ActivityStatus { get; set; } = string.Empty;
    public DateTimeOffset? ActualStartTime { get; set; }
    public DateTimeOffset? ActualEndTime { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? CancellationReason { get; set; }
    public string? Note { get; set; }
}

public class CustomerTicketImageDto
{
    public Guid Id { get; set; }
    public Guid TourInstanceDayActivityId { get; set; }
    public string PublicUrl { get; set; } = string.Empty;
    public string? BookingReference { get; set; }
    public string? Note { get; set; }
}

