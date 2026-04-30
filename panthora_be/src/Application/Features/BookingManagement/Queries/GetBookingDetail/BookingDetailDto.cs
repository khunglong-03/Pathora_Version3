using Domain.Entities;

namespace Application.Features.BookingManagement.Queries.GetBookingDetail;

public class BookingDetailDto
{
    public Guid Id { get; set; }
    public string TourName { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
    public string Tier { get; set; } = "standard";
    public string Status { get; set; } = string.Empty;
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
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingBalance { get; set; }
    public string Image { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Highlights { get; set; } = [];
    public List<string> ImportantInfo { get; set; } = [];
    public Guid? PendingTransactionId { get; set; }
}
