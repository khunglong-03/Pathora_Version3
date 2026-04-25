using System.Text.RegularExpressions;

namespace Application.Common;

public static class CloudinaryUtils
{
    /// <summary>
    /// Trích xuất Public ID từ URL Cloudinary.
    /// Ví dụ: https://res.cloudinary.com/demo/image/upload/v12345/folder/subfolder/sample.jpg
    /// Kết quả: folder/subfolder/sample
    /// </summary>
    public static string? ExtractPublicIdFromUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;

        try
        {
            // Regex tìm phần sau image/upload/v.../ và trước extension .jpg, .png...
            var match = Regex.Match(url, @"/upload/(?:v\d+/)?(.+?)\.[a-z]+$", RegexOptions.IgnoreCase);
            
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
        }
        catch
        {
            // Trả về null nếu url không đúng định dạng Cloudinary
        }

        return null;
    }
}
