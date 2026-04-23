namespace Application.Common.Constant;

public static class ErrorConstants
{
    public static class Classification
    {
        public const string NotFoundCode = "Classification.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Phân loại tour không tồn tại", "Tour classification not found");
    }

    public static class Department
    {
        public const string NotFoundCode = "Department.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Phòng ban không tồn tại", "Department not found");
    }

    public static class Position
    {
        public const string NotFoundCode = "Position.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Chức vụ không tồn tại", "Position not found");
    }

    public static class RefreshToken
    {
        public const string NotFoundCode = "RefreshToken.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Refresh token không tồn tại", "Refresh token not found");
        public const string ExpiredCode = "RefreshToken.Expired";
        public static readonly LocalizedMessage ExpiredDescription =
            new("Refresh token đã hết hạn", "Refresh token has expired");
    }

    public static class Role
    {
        public const string NotFoundCode = "Role.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Role không tồn tại", "Role not found");
    }

    public static class Tour
    {
        public const string NotFoundCode = "Tour.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Tour không tồn tại", "Tour not found");
        public static readonly LocalizedMessage PublicNotFoundDescription =
            new("Tour không tìm thấy", "Tour not found");
        public const string DuplicateCodeCode = "Tour.DuplicateCode";
        public static readonly LocalizedMessage DuplicateCodeDescriptionTemplate =
            new("Mã tour '{0}' đã tồn tại", "Tour code '{0}' already exists");

        public const string ConcurrencyConflictCode = "Tour.ConcurrencyConflict";
        public static readonly LocalizedMessage ConcurrencyConflictDescription =
            new(
                "Tour này đã được sửa bởi người khác. Vui lòng tải lại và thử lại.",
                "This tour was modified by another user. Please refresh and try again.");
    }

    public static class TourInstance
    {
        public const string NotFoundCode = "TourInstance.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Lịch trình tour không tồn tại", "Tour instance not found");
        public static readonly LocalizedMessage PublicNotFoundDescription =
            new(
                "Lịch trình tour không tồn tại hoặc không khả dụng",
                "Tour instance not found or unavailable");

        public const string ConcurrencyConflictCode = "TourInstance.ConcurrencyConflict";
        public static readonly LocalizedMessage ConcurrencyConflictDescription =
            new(
                "Lịch khởi hành này đã được sửa bởi người khác. Vui lòng tải lại và thử lại.",
                "This tour instance was modified by another user. Please refresh and try again.");
    }

    public static class TourRequest
    {
        public const string NotFoundCode = "TourRequest.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Yêu cầu tour không tồn tại", "Tour request not found");

        public const string ForbiddenCode = "TourRequest.Forbidden";
        public static readonly LocalizedMessage ForbiddenDescription =
            new(
                "Bạn không có quyền truy cập yêu cầu tour này",
                "You do not have permission to access this tour request");

        public const string AdminOnlyCode = "TourRequest.AdminOnly";
        public static readonly LocalizedMessage AdminOnlyDescription =
            new(
                "Chỉ quản trị viên mới có quyền thực hiện thao tác này",
                "Only administrators can perform this action");

        public const string ReviewerOnlyCode = "TourRequest.ReviewerOnly";
        public static readonly LocalizedMessage ReviewerOnlyDescription =
            new(
                "Chỉ quản trị viên hoặc quản lý mới có quyền thực hiện thao tác này",
                "Only administrators or managers can perform this action");

        public const string InvalidStatusTransitionCode = "TourRequest.InvalidStatusTransition";
        public static readonly LocalizedMessage InvalidStatusTransitionDescription =
            new("Không thể chuyển trạng thái yêu cầu tour", "Cannot transition tour request status");
    }

    public static class User
    {
        public const string NotFoundCode = "User.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Người dùng không tồn tại", "User not found");
        public static readonly LocalizedMessage NotFoundForInvalidCredentialsDescription =
            new("Email hoặc mật khẩu không đúng", "Email or password is incorrect");

        public const string InvalidPasswordCode = "User.InvalidPassword";
        public static readonly LocalizedMessage InvalidPasswordForInvalidCredentialsDescription =
            new("Email hoặc mật khẩu không đúng", "Email or password is incorrect");
        public static readonly LocalizedMessage InvalidPasswordDescription =
            new("Mật khẩu cũ không đúng", "Current password is incorrect");

        public const string DuplicateEmailCode = "User.DuplicateEmail";
        public static readonly LocalizedMessage DuplicateEmailDescription =
            new("Email đã được sử dụng", "Email is already in use");

        public const string UnauthorizedCode = "User.Unauthorized";
        public static readonly LocalizedMessage UnauthorizedDescription =
            new("Người dùng chưa đăng nhập", "User is not authenticated");

        public const string InvalidIdCode = "User.InvalidId";
        public static readonly LocalizedMessage InvalidIdDescription =
            new("User ID không hợp lệ", "Invalid user ID");
        public static readonly LocalizedMessage InvalidIdFormatDescription =
            new("Định dạng UserId không hợp lệ.", "Invalid UserId format.");

        public const string FunctionsNotFoundCode = "User.FunctionsNotFound";
        public static readonly LocalizedMessage FunctionsNotFoundDescription =
            new("Không tìm thấy chức năng nào cho người dùng này.", "No functions found for this user.");

        public static readonly LocalizedMessage AssignedUserNotFoundDescription =
            new("Không tìm thấy user được phân công.", "Assigned user not found.");
    }

    public static class Authorization
    {
        public static readonly LocalizedMessage ForbiddenDescription =
            new(
                "Người dùng không có quyền truy cập chức năng này",
                "User does not have permission to access this function");

        public static readonly LocalizedMessage UnauthorizedDescription =
            new("Người dùng chưa được xác thực", "User is not authenticated");
    }

    public static class Auth
    {
        public static readonly LocalizedMessage EmailNotFoundDescriptionTemplate =
            new("Không tìm thấy user với email: {0}", "User not found with email: {0}");

        public static readonly LocalizedMessage PasswordChangedDescriptionTemplate =
            new(
                "Đã đổi mật khẩu cho {0} (username: {1})",
                "Password changed for {0} (username: {1})");

        public static readonly LocalizedMessage NewPasswordRequiredDescription =
            new("Mật khẩu mới không được để trống", "New password must not be empty");

        public static readonly LocalizedMessage PasswordChangedForAccountsDescriptionTemplate =
            new("Đã đổi mật khẩu cho {0} tài khoản", "Password changed for {0} accounts");

        public const string EmailTemporarilyLockedCode = "Auth.EmailTemporarilyLocked";
        public static readonly LocalizedMessage EmailTemporarilyLockedDescription =
            new("Email này đã bị tạm khóa do đăng ký thất bại nhiều lần. Vui lòng thử lại sau {0} phút.", "This email has been temporarily locked due to multiple failed registration attempts. Please try again in {0} minutes.");

        public const string InvalidCredentialsCode = "Identity.InvalidCredentials";
        public static readonly LocalizedMessage InvalidCredentialsDescription =
            new("Thông tin đăng nhập không hợp lệ", "Invalid username or password");

        public const string AccountForbiddenCode = "Identity.AccountForbidden";
        public static readonly LocalizedMessage AccountForbiddenDescription =
            new("Tài khoản đã bị khóa, vô hiệu hóa hoặc hết hạn", "Account is locked, deactivated, or expired");

        public const string ServiceUnavailableCode = "Identity.ServiceUnavailable";
        public static readonly LocalizedMessage ServiceUnavailableDescription =
            new("Dịch vụ xác thực tạm thời không khả dụng", "Authentication service is temporarily unavailable");
    }

    public static class Booking
    {
        public const string NotFoundCode = "Booking.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy booking.", "Booking not found.");

        public const string SeatCapacityExceededCode = "Booking.SeatCapacityExceeded";
        public static readonly LocalizedMessage SeatCapacityExceededDescriptionTemplate =
            new(
                "Số lượng participant ({0}) vượt quá sức chứa ghế ({1}).",
                "Participant count ({0}) exceeds seat capacity ({1}).");

        public const string RoomCapacityExceededCode = "Booking.RoomCapacityExceeded";
        public static readonly LocalizedMessage RoomCapacityExceededDescriptionTemplate =
            new(
                "Số lượng participant ({0}) vượt quá sức chứa phòng ({1}).",
                "Participant count ({0}) exceeds room capacity ({1}).");
    }

    public static class TourGuide
    {
        public const string NotFoundCode = "TourGuide.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy hướng dẫn viên.", "Tour guide not found.");

        public const string LicenseExistsCode = "TourGuide.LicenseExists";
        public static readonly LocalizedMessage LicenseExistsDescription =
            new("Số giấy phép hướng dẫn viên đã tồn tại.", "Tour guide license number already exists.");

        public const string UnavailableCode = "TourGuide.Unavailable";
        public static readonly LocalizedMessage UnavailableDescription =
            new("Hướng dẫn viên hiện không khả dụng.", "Tour guide is currently unavailable.");
    }

    public static class BookingTeam
    {
        public const string AssignmentExistsCode = "BookingTeam.AssignmentExists";
        public static readonly LocalizedMessage AssignmentExistsDescription =
            new("User đã được phân công trong booking này.", "User is already assigned in this booking.");

        public const string TourGuideRequiredCode = "BookingTeam.TourGuideRequired";
        public static readonly LocalizedMessage TourGuideRequiredDescription =
            new("Thiếu TourGuideId cho vai trò TourGuide.", "TourGuideId is required for TourGuide role.");

        public const string AssignmentNotFoundCode = "BookingTeam.AssignmentNotFound";
        public static readonly LocalizedMessage AssignmentNotFoundDescription =
            new("Không tìm thấy phân công trong booking.", "Assignment not found in booking.");

        public const string TourManagerNotFoundCode = "BookingTeam.TourManagerNotFound";
        public static readonly LocalizedMessage TourManagerNotFoundDescription =
            new("Không tìm thấy TourManager cho booking.", "Tour manager not found for booking.");
    }

    public static class BookingParticipant
    {
        public const string NotFoundCode = "BookingParticipant.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy participant.", "Participant not found.");
    }

    public static class Passport
    {
        public const string NotFoundCode = "Passport.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy passport.", "Passport not found.");

        public const string ExistsCode = "Passport.Exists";
        public static readonly LocalizedMessage ExistsDescription =
            new("Participant đã có passport.", "Participant already has a passport.");

        public const string ExpiryBeforeTourStartCode = "Passport.ExpiryBeforeTourStart";
        public static readonly LocalizedMessage ExpiryBeforeTourStartDescription =
            new(
                "Ngày hết hạn passport phải sau ngày khởi hành tour.",
                "Passport expiry date must be after the tour start date.");
    }

    public static class VisaApplication
    {
        public const string NotFoundCode = "VisaApplication.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy visa application.", "Visa application not found.");

        public const string PassportInvalidCode = "VisaApplication.PassportInvalid";
        public static readonly LocalizedMessage PassportInvalidDescription =
            new("Passport không hợp lệ cho participant.", "Passport is invalid for participant.");

        public const string ApprovalTooLateCode = "VisaApplication.ApprovalTooLate";
        public static readonly LocalizedMessage ApprovalTooLateDescription =
            new(
                "Visa phải được phê duyệt trước ngày khởi hành tour.",
                "Visa must be approved before the tour start date.");
    }

    public static class Visa
    {
        public const string ExistsCode = "Visa.Exists";
        public static readonly LocalizedMessage ExistsDescription =
            new("Visa cho application đã tồn tại.", "Visa for this application already exists.");

        public const string ApprovalTooLateCode = "Visa.ApprovalTooLate";
        public static readonly LocalizedMessage ApprovalTooLateDescription =
            new(
                "Visa phải được phê duyệt trước ngày khởi hành tour.",
                "Visa must be approved before the tour start date.");
    }

    public static class BookingActivityReservation
    {
        public const string NotFoundCode = "BookingActivityReservation.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy activity reservation.", "Activity reservation not found.");
    }

    public static class BookingTransportDetail
    {
        public const string NotFoundCode = "BookingTransportDetail.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy transport detail.", "Transport detail not found.");
    }

    public static class BookingAccommodationDetail
    {
        public const string NotFoundCode = "BookingAccommodationDetail.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy accommodation detail.", "Accommodation detail not found.");
    }

    public static class Supplier
    {
        public const string NotFoundCode = "Supplier.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy nhà cung cấp.", "Supplier not found.");

        public const string CodeExistsCode = "Supplier.CodeExists";
        public static readonly LocalizedMessage CodeExistsDescription =
            new("Mã nhà cung cấp đã tồn tại.", "Supplier code already exists.");

        public const string AccommodationNotFoundCode = "Supplier.AccommodationNotFound";
        public static readonly LocalizedMessage AccommodationNotFoundDescription =
            new("Không tìm thấy nhà cung cấp lưu trú cho tài khoản của bạn.", "No accommodation supplier found for your account.");

        public const string NotAccommodationSupplierCode = "Supplier.NotAccommodationSupplier";
        public static readonly LocalizedMessage NotAccommodationSupplierDescription =
            new("Bạn không có nhà cung cấp lưu trú.", "You do not have an accommodation supplier.");
    }

    public static class Accommodation
    {
        public const string DuplicateCode = "Accommodation.Duplicate";
        public static readonly LocalizedMessage DuplicateDescription =
            new("Đã tồn tại một mục lưu trú cho loại phòng này.", "An accommodation entry for this room type already exists.");

        public const string NotFoundCode = "Accommodation.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy mục lưu trú.", "Accommodation not found.");
    }

    public static class GuestArrival
    {
        public const string NotFoundCode = "GuestArrival.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy thông tin nhận phòng.", "Guest arrival record not found.");

        public const string ExistsCode = "GuestArrival.Exists";
        public static readonly LocalizedMessage ExistsDescription =
            new("Thông tin nhận phòng đã tồn tại cho chi tiết lưu trú này.", "A guest arrival record already exists for this accommodation detail.");
    }

    public static class SupplierPayable
    {
        public const string NotFoundCode = "SupplierPayable.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy payable.", "Supplier payable not found.");
    }

    public static class Payment
    {
        public const string TransactionNotFoundCode = "Payment.TransactionNotFound";
        public static readonly LocalizedMessage TransactionNotFoundDescription =
            new("Không tìm thấy giao dịch thanh toán", "Payment transaction not found");

        public const string TransactionExpiredCode = "Payment.TransactionExpired";
        public static readonly LocalizedMessage TransactionExpiredDescription =
            new("Giao dịch thanh toán đã hết hạn", "Payment transaction has expired");

        public const string TransactionAlreadyCompletedCode = "Payment.TransactionAlreadyCompleted";
        public static readonly LocalizedMessage TransactionAlreadyCompletedDescription =
            new("Giao dịch thanh toán đã hoàn thành", "Payment transaction already completed");

        public const string InvalidAmountCode = "Payment.InvalidAmount";
        public static readonly LocalizedMessage InvalidAmountDescription =
            new("Số tiền thanh toán không hợp lệ", "Invalid payment amount");

        public const string InvalidPaymentMethodCode = "Payment.InvalidPaymentMethod";
        public static readonly LocalizedMessage InvalidPaymentMethodDescription =
            new("Phương thức thanh toán không hợp lệ", "Invalid payment method");

        public const string BookingNotFoundCode = "Payment.BookingNotFound";
        public static readonly LocalizedMessage BookingNotFoundDescription =
            new("Không tìm thấy đơn đặt tour", "Tour booking not found");

        public const string PaymentProcessingFailedCode = "Payment.PaymentProcessingFailed";
        public static readonly LocalizedMessage PaymentProcessingFailedDescription =
            new("Xử lý thanh toán thất bại", "Payment processing failed");

        public const string TransactionAlreadyCancelledCode = "Payment.TransactionAlreadyCancelled";
        public static readonly LocalizedMessage TransactionAlreadyCancelledDescription =
            new("Giao dịch thanh toán đã bị hủy", "Payment transaction already cancelled");

        public const string NoBankAccountCode = "Payment.NoBankAccount";
        public static readonly LocalizedMessage NoBankAccountDescription =
            new("Quản lý chưa có tài khoản ngân hàng được thiết lập", "Manager does not have a bank account configured");
    }

    public static class ActivityStatus
    {
        public const string NotFoundCode = "ActivityStatus.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy trạng thái hoạt động.", "Activity status not found.");

        public const string CancelledCode = "ActivityStatus.Cancelled";
        public static readonly LocalizedMessage CancelledDescription =
            new(
                "Không thể gán hướng dẫn viên cho hoạt động đã hủy.",
                "Cannot assign a tour guide to a cancelled activity.");

        public static readonly LocalizedMessage DefaultCancelReason =
            new("Hủy hoạt động", "Cancel activity");
    }

    public static class PricingPolicy
    {
        public const string NotFoundCode = "PricingPolicy.NotFound";
        public static readonly LocalizedMessage NotFoundDescription =
            new("Không tìm thấy chính sách giá.", "Pricing policy not found.");
    }

    public static class Common
    {
        public const string ConcurrencyConflictCode = "CONCURRENCY_CONFLICT";
        public static readonly LocalizedMessage ConcurrencyConflictDescription =
            new(
                "Tài nguyên đã bị thay đổi bởi một yêu cầu khác. Vui lòng tải lại trang và thử lại.",
                "The resource was modified by another request. Please refresh and try again.");
    }

    public static string ResolveByCode(string? code, string? lang, string fallbackDescription)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return fallbackDescription;
        }

        if (code == Tour.NotFoundCode)
        {
            var isPublicNotFound = fallbackDescription == Tour.PublicNotFoundDescription.Vi
                || fallbackDescription == Tour.PublicNotFoundDescription.En;
            if (isPublicNotFound)
            {
                return Tour.PublicNotFoundDescription.Resolve(lang);
            }

            var isNotFound = fallbackDescription == Tour.NotFoundDescription.Vi
                || fallbackDescription == Tour.NotFoundDescription.En;
            return isNotFound ? Tour.NotFoundDescription.Resolve(lang) : fallbackDescription;
        }

        if (code == TourInstance.NotFoundCode)
        {
            var isPublicNotFound = fallbackDescription == TourInstance.PublicNotFoundDescription.Vi
                || fallbackDescription == TourInstance.PublicNotFoundDescription.En;
            if (isPublicNotFound)
            {
                return TourInstance.PublicNotFoundDescription.Resolve(lang);
            }

            var isNotFound = fallbackDescription == TourInstance.NotFoundDescription.Vi
                || fallbackDescription == TourInstance.NotFoundDescription.En;
            return isNotFound ? TourInstance.NotFoundDescription.Resolve(lang) : fallbackDescription;
        }

        if (code == TourInstance.ConcurrencyConflictCode)
        {
            return TourInstance.ConcurrencyConflictDescription.Resolve(lang);
        }

        if (code == User.NotFoundCode)
        {
            if (fallbackDescription == User.NotFoundForInvalidCredentialsDescription.Vi
                || fallbackDescription == User.NotFoundForInvalidCredentialsDescription.En)
            {
                return User.NotFoundForInvalidCredentialsDescription.Resolve(lang);
            }

            if (fallbackDescription == User.AssignedUserNotFoundDescription.Vi
                || fallbackDescription == User.AssignedUserNotFoundDescription.En)
            {
                return User.AssignedUserNotFoundDescription.Resolve(lang);
            }

            var isNotFound = fallbackDescription == User.NotFoundDescription.Vi
                || fallbackDescription == User.NotFoundDescription.En;
            return isNotFound ? User.NotFoundDescription.Resolve(lang) : fallbackDescription;
        }

        if (code == User.InvalidPasswordCode)
        {
            var isInvalidCredentials = fallbackDescription == User.InvalidPasswordForInvalidCredentialsDescription.Vi
                || fallbackDescription == User.InvalidPasswordForInvalidCredentialsDescription.En;
            if (isInvalidCredentials)
            {
                return User.InvalidPasswordForInvalidCredentialsDescription.Resolve(lang);
            }

            var isInvalidPassword = fallbackDescription == User.InvalidPasswordDescription.Vi
                || fallbackDescription == User.InvalidPasswordDescription.En;
            return isInvalidPassword ? User.InvalidPasswordDescription.Resolve(lang) : fallbackDescription;
        }

        if (code == User.InvalidIdCode)
        {
            var isInvalidFormat = fallbackDescription == User.InvalidIdFormatDescription.Vi
                || fallbackDescription == User.InvalidIdFormatDescription.En;
            if (isInvalidFormat)
            {
                return User.InvalidIdFormatDescription.Resolve(lang);
            }

            var isInvalidId = fallbackDescription == User.InvalidIdDescription.Vi
                || fallbackDescription == User.InvalidIdDescription.En;
            return isInvalidId ? User.InvalidIdDescription.Resolve(lang) : fallbackDescription;
        }

        var message = code switch
        {
            var value when value == Classification.NotFoundCode => Classification.NotFoundDescription,
            var value when value == Department.NotFoundCode => Department.NotFoundDescription,
            var value when value == Position.NotFoundCode => Position.NotFoundDescription,
            var value when value == RefreshToken.NotFoundCode => RefreshToken.NotFoundDescription,
            var value when value == RefreshToken.ExpiredCode => RefreshToken.ExpiredDescription,
            var value when value == Role.NotFoundCode => Role.NotFoundDescription,
            var value when value == TourRequest.NotFoundCode => TourRequest.NotFoundDescription,
            var value when value == TourRequest.ForbiddenCode => TourRequest.ForbiddenDescription,
            var value when value == TourRequest.AdminOnlyCode => TourRequest.AdminOnlyDescription,
            var value when value == TourRequest.ReviewerOnlyCode => TourRequest.ReviewerOnlyDescription,
            var value when value == TourRequest.InvalidStatusTransitionCode => TourRequest.InvalidStatusTransitionDescription,
            var value when value == User.DuplicateEmailCode => User.DuplicateEmailDescription,
            var value when value == Auth.EmailTemporarilyLockedCode => Auth.EmailTemporarilyLockedDescription,
            var value when value == Auth.InvalidCredentialsCode => Auth.InvalidCredentialsDescription,
            var value when value == Auth.AccountForbiddenCode => Auth.AccountForbiddenDescription,
            var value when value == Auth.ServiceUnavailableCode => Auth.ServiceUnavailableDescription,
            var value when value == User.UnauthorizedCode => User.UnauthorizedDescription,
            var value when value == User.FunctionsNotFoundCode => User.FunctionsNotFoundDescription,
            var value when value == Booking.NotFoundCode => Booking.NotFoundDescription,
            var value when value == TourGuide.NotFoundCode => TourGuide.NotFoundDescription,
            var value when value == TourGuide.LicenseExistsCode => TourGuide.LicenseExistsDescription,
            var value when value == TourGuide.UnavailableCode => TourGuide.UnavailableDescription,
            var value when value == BookingTeam.AssignmentExistsCode => BookingTeam.AssignmentExistsDescription,
            var value when value == BookingTeam.TourGuideRequiredCode => BookingTeam.TourGuideRequiredDescription,
            var value when value == BookingTeam.AssignmentNotFoundCode => BookingTeam.AssignmentNotFoundDescription,
            var value when value == BookingTeam.TourManagerNotFoundCode => BookingTeam.TourManagerNotFoundDescription,
            var value when value == BookingParticipant.NotFoundCode => BookingParticipant.NotFoundDescription,
            var value when value == Passport.NotFoundCode => Passport.NotFoundDescription,
            var value when value == Passport.ExistsCode => Passport.ExistsDescription,
            var value when value == Passport.ExpiryBeforeTourStartCode => Passport.ExpiryBeforeTourStartDescription,
            var value when value == VisaApplication.NotFoundCode => VisaApplication.NotFoundDescription,
            var value when value == VisaApplication.PassportInvalidCode => VisaApplication.PassportInvalidDescription,
            var value when value == VisaApplication.ApprovalTooLateCode => VisaApplication.ApprovalTooLateDescription,
            var value when value == Visa.ExistsCode => Visa.ExistsDescription,
            var value when value == Visa.ApprovalTooLateCode => Visa.ApprovalTooLateDescription,
            var value when value == BookingActivityReservation.NotFoundCode => BookingActivityReservation.NotFoundDescription,
            var value when value == BookingTransportDetail.NotFoundCode => BookingTransportDetail.NotFoundDescription,
            var value when value == BookingAccommodationDetail.NotFoundCode => BookingAccommodationDetail.NotFoundDescription,
            var value when value == Supplier.NotFoundCode => Supplier.NotFoundDescription,
            var value when value == Supplier.CodeExistsCode => Supplier.CodeExistsDescription,
            var value when value == Supplier.AccommodationNotFoundCode => Supplier.AccommodationNotFoundDescription,
            var value when value == Supplier.NotAccommodationSupplierCode => Supplier.NotAccommodationSupplierDescription,
            var value when value == Accommodation.DuplicateCode => Accommodation.DuplicateDescription,
            var value when value == Accommodation.NotFoundCode => Accommodation.NotFoundDescription,
            var value when value == GuestArrival.NotFoundCode => GuestArrival.NotFoundDescription,
            var value when value == GuestArrival.ExistsCode => GuestArrival.ExistsDescription,
            var value when value == SupplierPayable.NotFoundCode => SupplierPayable.NotFoundDescription,
            var value when value == ActivityStatus.NotFoundCode => ActivityStatus.NotFoundDescription,
            var value when value == ActivityStatus.CancelledCode => ActivityStatus.CancelledDescription,
            var value when value == TourInstance.ConcurrencyConflictCode => TourInstance.ConcurrencyConflictDescription,
            var value when value == Tour.ConcurrencyConflictCode => Tour.ConcurrencyConflictDescription,
            var value when value == PricingPolicy.NotFoundCode => PricingPolicy.NotFoundDescription,
            var value when value == Payment.TransactionNotFoundCode => Payment.TransactionNotFoundDescription,
            var value when value == Payment.TransactionExpiredCode => Payment.TransactionExpiredDescription,
            var value when value == Payment.TransactionAlreadyCompletedCode => Payment.TransactionAlreadyCompletedDescription,
            var value when value == Payment.InvalidAmountCode => Payment.InvalidAmountDescription,
            var value when value == Payment.InvalidPaymentMethodCode => Payment.InvalidPaymentMethodDescription,
            var value when value == Payment.BookingNotFoundCode => Payment.BookingNotFoundDescription,
            var value when value == Payment.PaymentProcessingFailedCode => Payment.PaymentProcessingFailedDescription,
            var value when value == Payment.TransactionAlreadyCancelledCode => Payment.TransactionAlreadyCancelledDescription,
            _ => null,
        };

        if (message is null)
        {
            return fallbackDescription;
        }

        var isMappedMessage = fallbackDescription == message.Vi || fallbackDescription == message.En;
        return isMappedMessage ? message.Resolve(lang) : fallbackDescription;
    }
}
