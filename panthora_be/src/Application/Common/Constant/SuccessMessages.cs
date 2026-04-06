namespace Application.Common.Constant;

public static class SuccessMessages
{
    public static readonly LocalizedMessage General =
        new("Thành công", "Success");

    public static readonly LocalizedMessage Created =
        new("Tạo thành công", "Created successfully");

    public static readonly LocalizedMessage Updated =
        new("Cập nhật thành công", "Updated successfully");

    public static readonly LocalizedMessage Deleted =
        new("Xóa thành công", "Deleted successfully");

    public static readonly LocalizedMessage DataRetrieved =
        new("Lấy dữ liệu thành công", "Data retrieved successfully");

    public static readonly LocalizedMessage Performed =
        new("Thực thi thành công", "Operation completed successfully");
}
