namespace Domain.Entities;

public class BookingEntity : Aggregate<Guid>
{
    // Foreign keys
    public Guid TourInstanceId { get; set; }
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;
    public Guid? UserId { get; set; }
    public virtual UserEntity? User { get; set; }
    public Guid? TourRequestId { get; set; }
    public virtual TourRequestEntity? TourRequest { get; set; }

    // Customer info
    public string CustomerName { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public string? CustomerEmail { get; set; }

    // Participants
    public int NumberAdult { get; set; }
    public int NumberChild { get; set; }
    public int NumberInfant { get; set; }

    // Payment
    public decimal TotalPrice { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public bool IsFullPay { get; set; }

    // Booking type
    public BookingType BookingType { get; set; } = BookingType.InstanceJoin;

    // Status & dates
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTimeOffset BookingDate { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? CancelReason { get; set; }

    // Navigation
    public virtual List<BookingActivityReservationEntity> BookingActivityReservations { get; set; } = [];
    public virtual List<BookingParticipantEntity> BookingParticipants { get; set; } = [];
    public virtual List<BookingTourGuideEntity> BookingTourGuides { get; set; } = [];
    public virtual List<TourDayActivityStatusEntity> TourDayActivityStatuses { get; set; } = [];
    public virtual List<SupplierPayableEntity> SupplierPayables { get; set; } = [];
    public virtual List<CustomerDepositEntity> Deposits { get; set; } = [];
    public virtual List<CustomerPaymentEntity> Payments { get; set; } = [];
    public virtual List<PaymentTransactionEntity> PaymentTransactions { get; set; } = [];


    public static BookingEntity Create(
        Guid tourInstanceId,
        string customerName,
        string customerPhone,
        int numberAdult,
        decimal totalPrice,
        PaymentMethod paymentMethod,
        bool isFullPay,
        string performedBy,
        Guid? userId = null,
        Guid? tourRequestId = null,
        string? customerEmail = null,
        int numberChild = 0,
        int numberInfant = 0)
    {
        EnsureValidParticipants(numberAdult, numberChild, numberInfant);
        EnsureValidPrice(totalPrice);

        return new BookingEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            UserId = userId,
            TourRequestId = tourRequestId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            CustomerEmail = customerEmail,
            NumberAdult = numberAdult,
            NumberChild = numberChild,
            NumberInfant = numberInfant,
            TotalPrice = totalPrice,
            PaymentMethod = paymentMethod,
            IsFullPay = isFullPay,
            Status = BookingStatus.Pending,
            BookingDate = DateTimeOffset.UtcNow,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Confirm(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Confirmed);
        Status = BookingStatus.Confirmed;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkDeposited(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Deposited);
        Status = BookingStatus.Deposited;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkPaid(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Paid);
        Status = BookingStatus.Paid;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Complete(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Completed);
        Status = BookingStatus.Completed;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Cancel(string reason, string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Cancelled);
        Status = BookingStatus.Cancelled;
        CancelReason = reason;
        CancelledAt = DateTimeOffset.UtcNow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public int TotalParticipants() => NumberAdult + NumberChild + NumberInfant;

    private static void EnsureValidParticipants(int numberAdult, int numberChild, int numberInfant)
    {
        if (numberAdult <= 0)
            throw new ArgumentOutOfRangeException(nameof(numberAdult), "Số người lớn phải lớn hơn 0.");
        if (numberChild < 0)
            throw new ArgumentOutOfRangeException(nameof(numberChild), "Số trẻ em không được âm.");
        if (numberInfant < 0)
            throw new ArgumentOutOfRangeException(nameof(numberInfant), "Số em bé không được âm.");
    }

    private static void EnsureValidPrice(decimal totalPrice)
    {
        if (totalPrice < 0)
            throw new ArgumentOutOfRangeException(nameof(totalPrice), "Tổng giá không được âm.");
    }

    private static void EnsureValidTransition(BookingStatus current, BookingStatus next)
    {
        var valid = current switch
        {
            BookingStatus.Pending => next is BookingStatus.Confirmed or BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.Cancelled,
            BookingStatus.Confirmed => next is BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.Cancelled,
            BookingStatus.Deposited => next is BookingStatus.Paid or BookingStatus.Cancelled,
            BookingStatus.Paid => next is BookingStatus.Completed or BookingStatus.Cancelled,
            _ => false
        };

        if (!valid)
            throw new InvalidOperationException($"Không thể chuyển trạng thái từ {current} sang {next}.");
    }
}
