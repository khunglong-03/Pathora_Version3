namespace Domain.Entities;

using Domain.Events;

/// <summary>
/// Đại diện cho một booking (đặt tour) trong hệ thống. Liên kết khách hàng với một TourInstance cụ thể,
/// theo dõi số lượng người tham gia (người lớn/trẻ em/em bé), tổng giá, phương thức thanh toán,
/// và trạng thái booking. Trạng thái chuyển đổi theo machine: Pending → Confirmed → Deposited → Paid → Completed,
/// hoặc có thể bị hủy ở bất kỳ trạng thái nào trước Completed.
/// </summary>
public class BookingEntity : Aggregate<Guid>
{
    // Foreign keys
    /// <summary>ID của TourInstance mà booking này thuộc về.</summary>
    public Guid TourInstanceId { get; set; }
    /// <summary>TourInstance được đặt trong booking này.</summary>
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;
    /// <summary>ID của User (khách hàng đã đăng nhập) thực hiện booking. Null nếu là khách vãng lai.</summary>
    public Guid? UserId { get; set; }
    /// <summary>User thực hiện booking.</summary>
    public virtual UserEntity? User { get; set; }
    /// <summary>ID của TourRequest liên quan (nếu booking được tạo từ yêu cầu tư vấn).</summary>
    public Guid? TourRequestId { get; set; }
    /// <summary>TourRequest liên quan đến booking này.</summary>
    public virtual TourRequestEntity? TourRequest { get; set; }

    // Customer info
    /// <summary>Tên khách hàng.</summary>
    public string CustomerName { get; set; } = null!;
    /// <summary>Số điện thoại khách hàng.</summary>
    public string CustomerPhone { get; set; } = null!;
    /// <summary>Email khách hàng (optional).</summary>
    public string? CustomerEmail { get; set; }

    // Participants
    /// <summary>Số người lớn trong booking.</summary>
    public int NumberAdult { get; set; }
    /// <summary>Số trẻ em (2-11 tuổi) trong booking.</summary>
    public int NumberChild { get; set; }
    /// <summary>Số em bé (dưới 2 tuổi) trong booking.</summary>
    public int NumberInfant { get; set; }

    // Payment
    /// <summary>Tổng giá booking.</summary>
    public decimal TotalPrice { get; set; }
    /// <summary>Phương thức thanh toán (VNPay, MoMo, chuyển khoản, v.v.).</summary>
    public PaymentMethod PaymentMethod { get; set; }
    /// <summary>True nếu khách thanh toán đủ, False nếu chỉ đặt cọc.</summary>
    public bool IsFullPay { get; set; }

    /// <summary>Phí hỗ trợ visa (dynamic, do Manager báo giá). Cộng dồn vào TotalPrice khi được thêm.</summary>
    public decimal VisaServiceFeeTotal { get; private set; }

    // Booking type
    /// <summary>Loại booking: Join chuyến đi có sẵn hoặc Private tour riêng.</summary>
    public BookingType BookingType { get; set; } = BookingType.InstanceJoin;

    // Status & dates
    /// <summary>Trạng thái booking: Pending → Confirmed → Deposited → Paid → Completed, hoặc Cancelled.</summary>
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    /// <summary>Ngày giờ tạo booking.</summary>
    public DateTimeOffset BookingDate { get; set; }
    /// <summary>Ngày giờ hủy booking (null nếu chưa hủy).</summary>
    public DateTimeOffset? CancelledAt { get; set; }
    /// <summary>Lý do hủy booking.</summary>
    public string? CancelReason { get; set; }

    // Navigation
    /// <summary>Danh sách các hoạt động đã đặt trong booking này (ngày tham quan, vận chuyển, lưu trú).</summary>
    public virtual List<BookingActivityReservationEntity> BookingActivityReservations { get; set; } = [];
    /// <summary>Danh sách các thành viên tham gia trong booking (người lớn, trẻ em, em bé).</summary>
    public virtual List<BookingParticipantEntity> BookingParticipants { get; set; } = [];
    /// <summary>Danh sách hướng dẫn viên được phân công vào booking.</summary>
    public virtual List<BookingTourGuideEntity> BookingTourGuides { get; set; } = [];
    /// <summary>Danh sách trạng thái hoạt động theo ngày (tracking thực tế).</summary>
    public virtual List<TourDayActivityStatusEntity> TourDayActivityStatuses { get; set; } = [];
    /// <summary>Danh sách công nợ với nhà cung cấp cho booking này.</summary>
    public virtual List<SupplierPayableEntity> SupplierPayables { get; set; } = [];
    /// <summary>Danh sách các đợt đặt cọc của khách.</summary>
    public virtual List<CustomerDepositEntity> Deposits { get; set; } = [];
    /// <summary>Danh sách các khoản thanh toán của khách.</summary>
    public virtual List<CustomerPaymentEntity> Payments { get; set; } = [];
    /// <summary>Danh sách các giao dịch thanh toán của booking.</summary>
    public virtual List<PaymentTransactionEntity> PaymentTransactions { get; set; } = [];

    /// <summary>Ghi nhận hoàn / điều chỉnh ví liên quan booking (OpenSpec TransactionHistory).</summary>
    public virtual List<TransactionHistoryEntity> TransactionHistories { get; set; } = [];


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
        int numberInfant = 0,
        BookingType bookingType = BookingType.InstanceJoin)
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
            BookingType = bookingType,
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

    /// <summary>Chờ top-up sau khi <c>FinalSellPrice</c> &gt; tổng đã thanh toán.</summary>
    public void MarkPendingAdjustment(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.PendingAdjustment);
        Status = BookingStatus.PendingAdjustment;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Complete(string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Completed);
        var oldStatus = Status;
        Status = BookingStatus.Completed;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
        AddDomainEvent(new BookingStatusChangedEvent(Id, oldStatus, BookingStatus.Completed, performedBy));
    }

    public void Cancel(string reason, string performedBy)
    {
        EnsureValidTransition(Status, BookingStatus.Cancelled);
        var oldStatus = Status;
        Status = BookingStatus.Cancelled;
        CancelReason = reason;
        CancelledAt = DateTimeOffset.UtcNow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
        AddDomainEvent(new BookingStatusChangedEvent(Id, oldStatus, BookingStatus.Cancelled, performedBy));
    }

    public int TotalParticipants() => NumberAdult + NumberChild + NumberInfant;

    /// <summary>
    /// Cộng phí hỗ trợ visa vào booking. Không đổi BookingStatus.
    /// Guard: amount phải dương.
    /// </summary>
    public void AddVisaServiceFee(decimal amount, string performedBy)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Phí visa phải lớn hơn 0.");
        VisaServiceFeeTotal += amount;
        TotalPrice += amount;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

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
            BookingStatus.Pending => next is BookingStatus.Confirmed or BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.PendingAdjustment or BookingStatus.Cancelled,
            BookingStatus.Confirmed => next is BookingStatus.Deposited or BookingStatus.Paid or BookingStatus.PendingAdjustment or BookingStatus.Cancelled,
            BookingStatus.Deposited => next is BookingStatus.Paid or BookingStatus.PendingAdjustment or BookingStatus.Cancelled,
            BookingStatus.Paid => next is BookingStatus.PendingAdjustment or BookingStatus.Completed or BookingStatus.Confirmed or BookingStatus.Cancelled,
            BookingStatus.PendingAdjustment => next is BookingStatus.Paid or BookingStatus.Cancelled,
            BookingStatus.Completed => false,
            BookingStatus.Cancelled => false,
            _ => false
        };

        if (!valid)
            throw new InvalidOperationException($"Không thể chuyển trạng thái từ {current} sang {next}.");
    }
}
