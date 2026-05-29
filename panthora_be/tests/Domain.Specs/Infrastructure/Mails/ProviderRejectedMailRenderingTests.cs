using System;
using System.Collections.Generic;
using Domain.Mails;
using Infrastructure.Mails;
using Xunit;

namespace Domain.Specs.Infrastructure.Mails;

public sealed class ProviderRejectedMailRenderingTests
{
    [Fact]
    public void Render_ProviderRejectedTourInstanceMail_HtmlContainsCorrectInformation()
    {
        // Arrange
        var activityLines = new List<string>
        {
            "Ngày 1: Tham quan Vịnh Hạ Long",
            "Ngày 2: Chèo thuyền Kayak"
        };
        var mailDto = new ProviderRejectedTourInstanceMail(
            OperatorName: "Nguyễn Văn A",
            SupplierName: "Khách Sạn Mường Thanh",
            ProviderType: "Hotel",
            TourCode: "TI-HL-001",
            TourName: "Hạ Long Kỳ Vĩ",
            StartDate: "10/06/2026",
            RejectionNote: "Hết phòng Deluxe theo yêu cầu.",
            ActivityLines: activityLines,
            OverflowCount: 0,
            DeepLink: "http://localhost:3000/tour-operator/tour-instances/123",
            HotlinePhone: "1900-1234"
        );

        // Act
        var html = MailTemplateService.RenderTemplate("provider-rejected-tour-instance", mailDto);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Nguyễn Văn A", html);
        Assert.Contains("Khách Sạn Mường Thanh", html);
        Assert.Contains("Hotel", html);
        Assert.Contains("TI-HL-001", html);
        Assert.Contains("Hạ Long Kỳ Vĩ", html);
        Assert.Contains("10/06/2026", html);
        Assert.Contains("Hết phòng Deluxe theo yêu cầu.", html);
        Assert.Contains("Ngày 1: Tham quan Vịnh Hạ Long", html);
        Assert.Contains("Ngày 2: Chèo thuyền Kayak", html);
        Assert.Contains("http://localhost:3000/tour-operator/tour-instances/123", html);
        Assert.Contains("1900-1234", html);
    }

    [Fact]
    public void Render_WithOverflowActivities_RendersOverflowText()
    {
        // Arrange
        var activityLines = new List<string>();
        for (int i = 1; i <= 50; i++)
        {
            activityLines.Add($"Ngày {i}: Hoạt động {i}");
        }

        var mailDto = new ProviderRejectedTourInstanceMail(
            OperatorName: "Nguyễn Văn A",
            SupplierName: "Nhà xe Hoàng Long",
            ProviderType: "Transport",
            TourCode: "TI-HL-001",
            TourName: "Hạ Long Kỳ Vĩ",
            StartDate: "10/06/2026",
            RejectionNote: "Không đủ xe 45 chỗ.",
            ActivityLines: activityLines,
            OverflowCount: 30,
            DeepLink: "http://localhost:3000/tour-operator/tour-instances/123",
            HotlinePhone: "1900-1234"
        );

        // Act
        var html = MailTemplateService.RenderTemplate("provider-rejected-tour-instance", mailDto);

        // Assert
        Assert.NotNull(html);
        Assert.Contains("Ngày 50: Hoạt động 50", html);
        Assert.Contains("... và 30 hoạt động khác", html);
    }
}
