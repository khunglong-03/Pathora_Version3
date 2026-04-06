using System.Text.Json;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data.Seed;

public static class SiteContentSeedData
{
    public static bool SeedData(AppDbContext context)
    {
        if (context.SiteContents.Any())
            return false;

        var seedData = GetAboutPageSeedData()
            .Concat(GetPoliciesPageSeedData())
            .ToList();

        context.SiteContents.AddRange(seedData);
        context.SaveChanges();
        return true;
    }

    private static List<SiteContentEntity> GetAboutPageSeedData()
    {
        var teamMembers = JsonSerializer.Serialize(new[]
        {
            new { name = "Le Anh Thu", role = "Master Tigress", description = "Disciplined and fierce leader with unmatched strength and precision.", toursLed = 320, image = "https://www.figma.com/api/mcp/asset/0ea21104-3b97-48ed-b725-d3fcf0ee6486" },
            new { name = "Phong Thai", role = "Master Viper", description = "Graceful and agile, specializing in fluid movements and elegant techniques.", toursLed = 210, image = "https://www.figma.com/api/mcp/asset/a3caa128-9842-4560-81e6-0a73263c6152" },
            new { name = "Nguyen The Hieu", role = "Master Crane", description = "Patient and wise, mastering aerial combat with extraordinary balance.", toursLed = 185, image = "https://www.figma.com/api/mcp/asset/db143d75-3a2b-4cba-9cb2-834ab9468540" },
            new { name = "Ngo Quoc Huy", role = "Master Mantis", description = "Small but mighty, bringing quick reflexes and surprising power to every challenge.", toursLed = 143, image = "https://www.figma.com/api/mcp/asset/8c5b96f4-4b7a-40f9-8c8e-c9bc23b4fdaa" },
            new { name = "Gorner Robin", role = "Master Monkey", description = "Playful and energetic, combining humor with incredible acrobatic skills.", toursLed = 98, image = "https://www.figma.com/api/mcp/asset/691b9bfd-c838-429e-a825-46288f09bdfd" }
        });

        var milestones = JsonSerializer.Serialize(new[]
        {
            new { year = "2010", titleKey = "founded", descKey = "foundedDesc" },
            new { year = "2014", titleKey = "first10k", descKey = "first10kDesc" },
            new { year = "2018", titleKey = "expanded60", descKey = "expanded60Desc" },
            new { year = "2022", titleKey = "digitalFirst", descKey = "digitalFirstDesc" },
            new { year = "2025", titleKey = "happy92k", descKey = "happy92kDesc" }
        });

        var stats = JsonSerializer.Serialize(new[]
        {
            new { icon = "heroicons-outline:map-pin", value = "240+", labelKey = "destinations" },
            new { icon = "heroicons-outline:users", value = "92K+", labelKey = "happyTravelers" },
            new { icon = "heroicons-outline:globe-alt", value = "3,600+", labelKey = "toursOffered" },
            new { icon = "heroicons-outline:heart", value = "98%", labelKey = "satisfactionRate" }
        });

        var values = JsonSerializer.Serialize(new[]
        {
            new { icon = "heroicons-outline:globe-alt", titleKey = "globalExpertise", descKey = "globalExpertiseDesc" },
            new { icon = "heroicons-outline:shield-check", titleKey = "safeTrusted", descKey = "safeTrustedDesc" },
            new { icon = "heroicons-outline:heart", titleKey = "tailoredForYou", descKey = "tailoredForYouDesc" },
            new { icon = "heroicons-outline:bolt", titleKey = "seamlessExperience", descKey = "seamlessExperienceDesc" }
        });

        return new List<SiteContentEntity>
        {
            SiteContentEntity.Create("about", "team-members", teamMembers, "seed"),
            SiteContentEntity.Create("about", "milestones", milestones, "seed"),
            SiteContentEntity.Create("about", "stats", stats, "seed"),
            SiteContentEntity.Create("about", "values", values, "seed")
        };
    }

    private static List<SiteContentEntity> GetPoliciesPageSeedData()
    {
        var enSections = new[]
        {
            new
            {
                id = "booking-payment",
                icon = "heroicons-outline:document-text",
                title = new { en = "Booking & Payment", vi = "Đặt chỗ và thanh toán" },
                items = new
                {
                    en = new[] { "Booking is confirmed only after payment or deposit based on the selected package.", "We accept all major credit cards, bank transfers, and e-wallets.", "Group bookings of 10 or more travelers receive a 10% discount.", "All prices are in USD unless otherwise specified." },
                    vi = new[] { "Đặt chỗ chỉ được xác nhận sau khi thanh toán hoặc đặt cọc theo gói đã chọn.", "Chúng tôi chấp nhận tất cả các thẻ tín dụng chính, chuyển khoản ngân hàng và ví điện tử.", "Đặt nhóm từ 10 khách trở lên được giảm giá 10%.", "Tất cả giá được tính bằng USD trừ khi có thông báo khác." }
                }
            },
            new
            {
                id = "cancellation-refund",
                icon = "heroicons-outline:arrow-path",
                title = new { en = "Cancellation & Refund", vi = "Hủy đặt chỗ và hoàn tiền" },
                items = new
                {
                    en = new[] { "Cancellations made 30+ days before departure: full refund minus processing fee.", "Cancellations made 15-29 days before departure: 50% refund.", "Cancellations made within 14 days of departure: no refund.", "No-shows are non-refundable.", "Special promotions and peak season bookings have separate cancellation terms." },
                    vi = new[] { "Hủy trước 30 ngày hoặc hơn: hoàn tiền đầy đủ trừ phí xử lý.", "Hủy trước 15-29 ngày: hoàn 50% giá trị.", "Hủy trong vòng 14 ngày trước ngày khởi hành: không hoàn tiền.", "Không xuất hiện tại thời điểm khởi hành: không hoàn tiền.", "Các chương trình khuyến mãi đặc biệt và mùa cao điểm có điều kiện hủy riêng." }
                }
            },
            new
            {
                id = "modification-rescheduling",
                icon = "heroicons-outline:clock",
                title = new { en = "Modification & Rescheduling", vi = "Thay đổi và đổi lịch" },
                items = new
                {
                    en = new[] { "Date changes are free of charge if made 14+ days in advance.", "Changes within 13 days incur a $25 rescheduling fee per person.", "Name corrections are allowed up to 48 hours before departure.", "Route or itinerary modifications are subject to availability." },
                    vi = new[] { "Thay đổi ngày khởi hành miễn phí nếu thực hiện trước 14 ngày hoặc hơn.", "Thay đổi trong vòng 13 ngày tính phí đổi lịch $25 mỗi người.", "Sửa tên được phép đến 48 giờ trước giờ khởi hành.", "Thay đổi hành trình phụ thuộc vào tình trạng còn chỗ." }
                }
            },
            new
            {
                id = "health-safety",
                icon = "heroicons-outline:shield-check",
                title = new { en = "Health & Safety", vi = "Sức khỏe và An toàn" },
                items = new
                {
                    en = new[] { "Travelers with pre-existing medical conditions must inform us at booking.", "Travel insurance is strongly recommended and available through our platform.", "Our tours comply with all local safety regulations and standards.", "Emergency contact numbers are provided in your booking confirmation." },
                    vi = new[] { "Khách có tình trạng sức khỏe đặc biệt phải thông báo cho chúng tôi khi đặt chỗ.", "Bảo hiểm du lịch được khuyến nghị mạnh mẽ và có sẵn qua nền tảng của chúng tôi.", "Các tour của chúng tôi tuân thủ mọi quy định và tiêu chuẩn an toàn địa phương.", "Số liên lạc khẩn cấp được cung cấp trong email xác nhận đặt chỗ." }
                }
            },
            new
            {
                id = "privacy-policy",
                icon = "heroicons-outline:lock-closed",
                title = new { en = "Privacy Policy", vi = "Chính sách bảo mật" },
                items = new
                {
                    en = new[] { "We collect only the information necessary to process your booking.", "Your personal data is encrypted and never shared with third parties without consent.", "You may request deletion of your account and data at any time.", "Cookies are used solely to improve your browsing experience." },
                    vi = new[] { "Chúng tôi chỉ thu thập thông tin cần thiết để xử lý đặt chỗ của bạn.", "Dữ liệu cá nhân của bạn được mã hóa và không chia sẻ với bên thứ ba khi chưa có sự đồng ý.", "Bạn có thể yêu cầu xóa tài khoản và dữ liệu bất kỳ lúc nào.", "Cookie chỉ được sử dụng để cải thiện trải nghiệm duyệt web của bạn." }
                }
            },
            new
            {
                id = "liability-disclaimer",
                icon = "heroicons-outline:exclamation-circle",
                title = new { en = "Liability Disclaimer", vi = "Tuyên bố miễn trách" },
                items = new
                {
                    en = new[] { "Pathora is not liable for events beyond our direct control, including weather or force majeure.", "Travelers are responsible for ensuring valid travel documents and visas.", "Lost or stolen belongings during the tour are the traveler's responsibility.", "By booking, you agree to our full terms and conditions." },
                    vi = new[] { "Pathora không chịu trách nhiệm cho các sự kiện ngoài tầm kiểm soát trực tiếp của chúng tôi, bao gồm thời tiết hoặc bất khả kháng.", "Khách du lịch chịu trách nhiệm đảm bảo giấy tờ du lịch và thị thực hợp lệ.", "Đồ bị mất hoặc bị đánh cắp trong tour là trách nhiệm của khách du lịch.", "Bằng việc đặt tour, bạn đồng ý với toàn bộ điều khoản và điều kiện của chúng tôi." }
                }
            }
        };

        SiteContentValueCodec.TryCreateLocalizedContentValue(
            JsonSerializer.Serialize(enSections),
            JsonSerializer.Serialize(enSections),
            out var contentValue,
            out _);

        return new List<SiteContentEntity>
        {
            SiteContentEntity.Create("policies", "policy-sections", contentValue, "seed")
        };
    }
}
