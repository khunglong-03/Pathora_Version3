namespace Application.Common.Constant;

public static class TicketImageErrors
{
    public const string NotFoundCode = "TicketImage.NotFound";
    public static readonly LocalizedMessage NotFoundDescription =
        new(
            "Không tìm thấy ảnh vé.",
            "Ticket image not found.");

    public const string ActivityNotExternalCode = "TicketImage.ActivityNotExternal";
    public static readonly LocalizedMessage ActivityNotExternalDescription =
        new(
            "Chỉ có thể tải vé cho hoạt động vận chuyển ngoài (vé máy bay/tàu/du thuyền).",
            "Ticket images can only be uploaded for external transport activities (flight/train/boat).");

    public const string NoBookingsCode = "TicketImage.NoBookings";
    public static readonly LocalizedMessage NoBookingsDescription =
        new(
            "Chỉ có thể tải vé sau khi tour có ít nhất một booking.",
            "Tickets can only be uploaded after the tour has at least one booking.");

    public const string InvalidFileTypeCode = "TicketImage.InvalidFileType";
    public static readonly LocalizedMessage InvalidFileTypeDescription =
        new(
            "Định dạng tệp không hợp lệ. Chỉ chấp nhận image/jpeg, image/png, image/webp.",
            "Invalid file type. Allowed formats: image/jpeg, image/png, image/webp.");

    public const string FileTooLargeCode = "TicketImage.FileTooLarge";
    public static readonly LocalizedMessage FileTooLargeDescription =
        new(
            "Kích thước tệp vượt giới hạn cho phép.",
            "File size exceeds the maximum allowed.");

    public const string EmptyFileCode = "TicketImage.EmptyFile";
    public static readonly LocalizedMessage EmptyFileDescription =
        new(
            "Tệp tải lên rỗng.",
            "Uploaded file is empty.");

    public const string CrossActivityDeleteCode = "TicketImage.CrossActivityDelete";
    public static readonly LocalizedMessage CrossActivityDeleteDescription =
        new(
            "Ảnh vé không thuộc hoạt động được chỉ định.",
            "Ticket image does not belong to the specified activity.");

    public const string DeleteForbiddenCode = "TicketImage.DeleteForbidden";
    public static readonly LocalizedMessage DeleteForbiddenDescription =
        new(
            "Bạn không có quyền xóa ảnh vé này — chỉ người tải lên hoặc Manager mới được xóa.",
            "You are not allowed to delete this ticket image — only the uploader or a Manager may delete it.");
}
