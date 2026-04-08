namespace Domain.Entities;

/// <summary>
/// Đại diện cho một cá nhân tham gia trong booking (người lớn, trẻ em, hoặc em bé).
/// Theo dõi thông tin cá nhân, loại hành khách, và trạng thái đặt chỗ.
/// Có thể có thông tin hộ chiếu và hồ sơ xin visa liên kết.
/// </summary>
public class BookingParticipantEntity : Aggregate<Guid>
{
    /// <summary>ID của booking cha mà participant này thuộc về.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha của participant.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;

    /// <summary>Loại participant: Adult, Child, hoặc Infant.</summary>
    public string ParticipantType { get; set; } = null!;
    /// <summary>Họ và tên đầy đủ của người tham gia.</summary>
    public string FullName { get; set; } = null!;
    /// <summary>Ngày sinh của participant.</summary>
    public DateTimeOffset? DateOfBirth { get; set; }
    /// <summary>Giới tính của participant.</summary>
    public GenderType? Gender { get; set; }
    /// <summary>Quốc tịch của participant.</summary>
    public string? Nationality { get; set; }
    /// <summary>Trạng thái đặt chỗ của participant: Pending, Confirmed, Cancelled.</summary>
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    /// <summary>Thông tin hộ chiếu của participant (nếu có).</summary>
    public virtual PassportEntity? Passport { get; set; }
    /// <summary>Danh sách các hồ sơ xin visa của participant.</summary>
    public virtual List<VisaApplicationEntity> VisaApplications { get; set; } = [];

    public static BookingParticipantEntity Create(
        Guid bookingId,
        string participantType,
        string fullName,
        string performedBy,
        DateTimeOffset? dateOfBirth = null,
        GenderType? gender = null,
        string? nationality = null)
    {
        return new BookingParticipantEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            ParticipantType = participantType,
            FullName = fullName,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            Nationality = nationality,
            Status = ReservationStatus.Pending,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string participantType,
        string fullName,
        string performedBy,
        DateTimeOffset? dateOfBirth = null,
        GenderType? gender = null,
        string? nationality = null,
        ReservationStatus? status = null)
    {
        ParticipantType = participantType;
        FullName = fullName;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        Nationality = nationality;
        Status = status ?? Status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
