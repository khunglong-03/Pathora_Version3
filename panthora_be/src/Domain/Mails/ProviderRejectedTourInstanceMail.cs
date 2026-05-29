using System.Collections.Generic;

namespace Domain.Mails;

/// <summary>
/// Email thông báo cho TourOperator/Manager khi nhà cung cấp từ chối duyệt TourInstance.
/// </summary>
[Mail("[Pathora] Nhà cung cấp từ chối duyệt tour {tour_code}", "provider-rejected-tour-instance")]
public sealed record ProviderRejectedTourInstanceMail(
    string OperatorName,
    string SupplierName,
    string ProviderType,
    string TourCode,
    string TourName,
    string StartDate,
    string RejectionNote,
    List<string> ActivityLines,
    int OverflowCount,
    string DeepLink,
    string HotlinePhone);
