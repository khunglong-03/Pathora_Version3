namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Chính sách visa — định nghĩa các quy định liên quan đến thị thực
/// (visa) cho khách du lịch khi tham gia tour quốc tế.
/// </summary>
public class VisaPolicyEntity : Aggregate<Guid>
{
    /// <summary>
    /// Khu vực/quốc gia mà chính sách visa này áp dụng.
    /// Ví dụ: "Vietnam", "Thailand", "Japan", "Schengen"... Dùng để
    /// xác định loại visa cần xin khi khách du lịch đến khu vực đó.
    /// </summary>
    public string Region { get; set; } = null!;

    /// <summary>
    /// Số ngày xử lý tiêu chuẩn để hoàn tất thủ tục xin visa.
    /// Đây là thời gian trung bình mà đại sứ quán/lãnh sự quán cần
    /// để xử lý hồ sơ và trả kết quả. Phải lớn hơn 0.
    /// </summary>
    public int ProcessingDays { get; set; }

    /// <summary>
    /// Số ngày dự trữ (buffer) thêm vào sau thời gian xử lý chuẩn.
    /// Dùng để phòng trường hợp hồ sơ bị trễ, cần bổ sung giấy tờ
    /// hoặc các tình huống bất ngờ khác. Có thể bằng 0.
    /// Tổng thời gian cần chuẩn bị visa = ProcessingDays + BufferDays.
    /// </summary>
    public int BufferDays { get; set; }

    /// <summary>
    /// Cờ yêu cầu thanh toán đầy đủ trước khi xử lý visa.
    /// Khi true: khách phải thanh toán 100% tiền tour trước khi
    /// hồ sơ visa được nộp/xử lý. Khi false: có thể đặt cọc trước.
    /// </summary>
    public bool FullPaymentRequired { get; set; }

    /// <summary>
    /// Cờ xóa mềm (soft-delete). Khi là true, chính sách bị xóa
    /// logic, không còn hiển thị trong danh sách nhưng dữ liệu vẫn
    /// được giữ trong CSDL phục vụ mục đích kiểm toán.
    /// </summary>
    public bool IsDeleted { get; set; }

    /// <summary>
    /// Cờ kích hoạt. Khi false, chính sách visa không được phép sử
    /// dụng cho tour mới dù không bị xóa. Dùng để tạm ngưng một
    /// chính sách mà không cần xóa (ví dụ: quốc gia đóng cửa visa).
    /// Mặc định là true (đang kích hoạt).
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Từ điển chứa nội dung đa ngôn ngữ, khóa là mã ngôn ngữ
    /// (ví dụ: "en", "vi"). Lưu trữ các bản dịch mô tả chi tiết
    /// về yêu cầu visa, giấy tờ cần chuẩn bị, lệ phí, v.v.
    /// </summary>
    public Dictionary<string, VisaPolicyTranslationData> Translations { get; set; } = [];

    /// <summary>
    /// Factory method tạo mới một VisaPolicyEntity với đầy đủ các
    /// trường bắt buộc. Tự động gán Id (Guid.CreateVersion7()),
    /// đặt IsDeleted = false, IsActive = true và khởi tạo timestamp
    /// kiểm toán.
    /// </summary>
    /// <param name="region">Khu vực/quốc gia áp dụng chính sách.</param>
    /// <param name="processingDays">Số ngày xử lý visa tiêu chuẩn (phải &gt; 0).</param>
    /// <param name="bufferDays">Số ngày dự trữ thêm (phải &gt;= 0).</param>
    /// <param name="fullPaymentRequired">Có yêu cầu thanh toán đầy đủ trước không.</param>
    /// <param name="performedBy">Tên đăng nhập của admin tạo chính sách.</param>
    /// <param name="translations">Bản dịch đa ngôn ngữ. Tùy chọn.</param>
    /// <returns>Instance <see cref="VisaPolicyEntity"/> đã khởi tạo đầy đủ.</returns>
    /// <exception cref="ArgumentException">Khi region rỗng hoặc chỉ có khoảng trắng.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Khi processingDays &lt;= 0 hoặc bufferDays &lt; 0.</exception>
    public static VisaPolicyEntity Create(
        string region,
        int processingDays,
        int bufferDays,
        bool fullPaymentRequired,
        string performedBy,
        Dictionary<string, VisaPolicyTranslationData>? translations = null)
    {
        if (string.IsNullOrWhiteSpace(region))
            throw new ArgumentException("Region is required.", nameof(region));
        if (processingDays <= 0)
            throw new ArgumentOutOfRangeException(nameof(processingDays), "Processing days must be greater than 0.");
        if (bufferDays < 0)
            throw new ArgumentOutOfRangeException(nameof(bufferDays), "Buffer days cannot be negative.");

        return new VisaPolicyEntity
        {
            Id = Guid.CreateVersion7(),
            Region = region,
            ProcessingDays = processingDays,
            BufferDays = bufferDays,
            FullPaymentRequired = fullPaymentRequired,
            IsDeleted = false,
            IsActive = true,
            Translations = translations ?? [],
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    /// <summary>
    /// Cập nhật các thuộc tính của chính sách visa. Kiểm tra tính
    /// hợp lệ của region và các giá trị số trước khi gán. Làm mới
    /// timestamp kiểm toán (LastModifiedBy, LastModifiedOnUtc).
    /// </summary>
    /// <param name="region">Khu vực/quốc gia mới.</param>
    /// <param name="processingDays">Số ngày xử lý visa mới (phải &gt; 0).</param>
    /// <param name="bufferDays">Số ngày dự trữ mới (phải &gt;= 0).</param>
    /// <param name="fullPaymentRequired">Cờ thanh toán đầy đủ mới.</param>
    /// <param name="performedBy">Tên đăng nhập của admin cập nhật.</param>
    /// <exception cref="ArgumentException">Khi region rỗng hoặc chỉ có khoảng trắng.</exception>
    /// <exception cref="ArgumentOutOfRangeException">Khi processingDays &lt;= 0 hoặc bufferDays &lt; 0.</exception>
    public void Update(
        string region,
        int processingDays,
        int bufferDays,
        bool fullPaymentRequired,
        string performedBy)
    {
        if (string.IsNullOrWhiteSpace(region))
            throw new ArgumentException("Region is required.", nameof(region));
        if (processingDays <= 0)
            throw new ArgumentOutOfRangeException(nameof(processingDays), "Processing days must be greater than 0.");
        if (bufferDays < 0)
            throw new ArgumentOutOfRangeException(nameof(bufferDays), "Buffer days cannot be negative.");

        Region = region;
        ProcessingDays = processingDays;
        BufferDays = bufferDays;
        FullPaymentRequired = fullPaymentRequired;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Bật hoặc tắt trạng thái kích hoạt của chính sách visa.
    /// Dùng để tạm ngưng (deactivate) một chính sách mà không cần
    /// xóa, ví dụ khi quốc gia tạm ngừng cấp visa hoặc chính sách
    /// đang được cập nhật.
    /// </summary>
    /// <param name="isActive">True để kích hoạt, false để vô hiệu hóa.</param>
    /// <param name="performedBy">Tên đăng nhập của admin thực hiện thay đổi.</param>
    public void SetActive(bool isActive, string performedBy)
    {
        IsActive = isActive;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Thực hiện xóa mềm chính sách visa bằng cách đặt
    /// <see cref="IsDeleted"/> = true. Bản ghi vẫn tồn tại trong
    /// CSDL phục vụ lịch sử kiểm toán nhưng không còn xuất hiện
    /// trong các truy vấn thông thường.
    /// </summary>
    /// <param name="performedBy">Tên đăng nhập của admin thực hiện xóa.</param>
    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
