namespace Application.Common.Constant;

/// <summary>
/// Centralized validation messages used across FluentValidation validators.
/// </summary>
public static class ValidationMessages
{
    // ── Common ──────────────────────────────────────────────────────────
    public const string DescriptionMaxLength250 = "Description must not exceed 250 characters.";
    public const string CommonIdRequired = "ID is required.";
    public const string CommonTokenRequired = "Token is required.";

    // ── Email ───────────────────────────────────────────────────────────
    public const string EmailRequired = "Email is required.";
    public const string EmailInvalid = "Invalid email address.";

    // ── Password ────────────────────────────────────────────────────────
    public const string PasswordRequired = "Password is required.";
    public const string PasswordMinLength6 = "Password must be at least 6 characters.";
    public const string PasswordInvalidFormat = "Invalid password format.";
    public const string PasswordSqlInjectionDetected = "Password contains invalid SQL pattern.";
    public const string NewPasswordRequired = "New password is required.";
    public const string OldPasswordRequired = "Old password is required.";
    public const string PasswordComplexity =
        "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one digit, and one special character.";
    public const string NewPasswordMustDiffer = "New password must not be the same as the old password.";

    // ── User / Identity ─────────────────────────────────────────────────
    public const string PhoneNumberInvalid = "Invalid phone number format.";
    public const string AddressTooLong = "Address must not exceed 500 characters.";
    public const string FullNameRequired = "Name is required.";
    public const string FullNameAndLastNameRequired = "Full name is required.";
    public const string FullNameTooLong = "Full name is too long.";
    public const string UsernameRequired = "Username is required.";
    public const string UserIdRequired = "User ID is required.";
    public const string AvatarTooLong = "Avatar URL is too long.";
    public const string ProviderKeyRequired = "ProviderKey is required.";
    public const string ProviderEmailRequired = "Email is required.";
    public const string ProviderEmailInvalid = "Invalid email address.";

    // ── Role ────────────────────────────────────────────────────────────
    public const string RoleNameRequired = "Role name is required.";
    public const string RoleNameMaxLength100 = "Role name must not exceed 100 characters.";
    public const string RoleStatusInvalid = "Invalid role status.";

    // ── Department ──────────────────────────────────────────────────────
    public const string DepartmentNameRequired = "Department name is required.";
    public const string DepartmentNameMaxLength100 = "Department name must not exceed 100 characters.";

    // ── Position ────────────────────────────────────────────────────────
    public const string PositionNameRequired = "Position name is required.";
    public const string PositionNameMaxLength255 = "Position name must not exceed 255 characters.";
    public const string NoteMaxLength255 = "Note must not exceed 255 characters.";

    // ── Tour ────────────────────────────────────────────────────────────
    public const string TourCodeRequired = "Tour code is required.";
    public const string TourNameRequired = "Tour name is required.";
    public const string TourNameMaxLength500 = "Tour name must not exceed 500 characters.";
    public const string ShortDescriptionRequired = "Short description is required.";
    public const string ShortDescriptionMaxLength250 = "Short description must not exceed 250 characters.";
    public const string LongDescriptionRequired = "Long description is required.";
    public const string LongDescriptionMaxLength5000 = "Long description must not exceed 5000 characters.";
    public const string SEOTitleMaxLength70 = "SEO title must not exceed 70 characters.";
    public const string SEODescriptionMaxLength320 = "SEO description must not exceed 320 characters.";
    public const string TourStatusInvalid = "Invalid tour status.";
    public const string ThumbnailRequired = "Thumbnail image is required.";
    public const string ImagesRequired = "Tour images are required.";
    public const string ImagesAtLeastOne = "Tour must have at least one image.";

    // ── TourInstance ────────────────────────────────────────────────────
    public const string TourInstanceTourIdRequired = "Tour ID is required.";
    public const string TourInstanceClassificationIdRequired = "Classification ID is required.";
    public const string TourInstanceStartDateRequired = "Start date is required.";
    public const string TourInstanceEndDateRequired = "End date is required.";
    public const string TourInstanceEndDateAfterStart = "End date must be after start date.";
    public const string TourInstanceMaxParticipantsGreaterThanZero = "Max participants must be greater than 0.";
    public const string TourInstanceMinParticipantsNonNegative = "Min participants must not be negative.";
    public const string TourInstanceStatusRequired = "Status is required.";
    public const string TourInstanceIdRequired = "Tour instance ID is required.";
    public const string TourIdRequired = "Tour ID is required.";
    public const string TourInstanceTitleRequired = "Title is required.";
    public const string TourInstanceBasePriceRequired = "Base price is required.";
    public const string TourInstanceBasePriceNonNegative = "Base price must not be negative.";
    public const string TourInstanceConfirmationDeadlineBeforeStart = "Confirmation deadline must be before the tour start date.";
    public const string TourInstanceInstanceTypeInvalid = "Instance type must be a valid value (Private, Public, or Group).";
    public const string TourInstanceSellingPriceNonNegative = "Selling price must not be negative.";
    public const string TourInstanceOperatingCostNonNegative = "Operating cost must not be negative.";
    public const string TourInstanceDepositPerPersonNonNegative = "Deposit per person must not be negative.";

    // ── Public Search ──────────────────────────────────────────
    public const string SearchToursPageMinimum1 = "Page must be greater than or equal to 1.";
    public const string SearchToursPageSizeRange = "Page size must be between 1 and 50.";
    public const string SearchToursPeopleRange = "People must be between 1 and 50.";
    public const string SearchToursMinPriceMinimum0 = "Min price must be greater than or equal to 0.";
    public const string SearchToursMaxPriceMinimum0 = "Max price must be greater than or equal to 0.";
    public const string SearchToursMaxPriceGreaterThanOrEqualMinPrice = "Max price must be greater than or equal to min price.";
    public const string SearchToursMinDaysMinimum1 = "Min days must be greater than or equal to 1.";
    public const string SearchToursMaxDaysMinimum1 = "Max days must be greater than or equal to 1.";
    public const string SearchToursMaxDaysGreaterThanOrEqualMinDays = "Max days must be greater than or equal to min days.";

    // ── Public Query ───────────────────────────────────────────
    public const string PublicQueryLimitRange1To50 = "Limit must be between 1 and 50.";

    // ── Booking Management ─────────────────────────────────────
    public const string TourGuideRequiredForRole = "Tour guide is required when assigning TourGuide role.";
    public const string SupplierPayablePaidAmountMustNotExceedExpected = "Paid amount must not exceed expected amount.";

    // ── TourRequest ─────────────────────────────────────────────
    public const string TourRequestIdRequired = "Tour request ID is required.";
    public const string TourRequestPageNumberGreaterThanZero = "Page number must be greater than 0.";
    public const string TourRequestPageSizeRange = "Page size must be between 1 and 100.";
    public const string TourRequestToDateGreaterThanOrEqualFromDate = "To date must be greater than or equal to from date.";
    public const string TourRequestDestinationRequired = "Destination is required.";
    public const string TourRequestDestinationMaxLength500 = "Destination must not exceed 500 characters.";
    public const string TourRequestStartDateRequired = "Start date is required.";
    public const string TourRequestEndDateRequired = "End date is required.";
    public const string TourRequestEndDateAfterOrEqualStartDate = "End date must be greater than or equal to start date.";
    public const string TourRequestParticipantsGreaterThanZero = "Number of participants must be greater than 0.";
    public const string TourRequestBudgetGreaterThanZero = "Budget per person must be greater than 0.";
    public const string TourRequestTravelInterestsRequired = "At least one travel interest is required.";
    public const string TourRequestTravelInterestInvalid = "Travel interest is invalid.";
    public const string TourRequestPreferredAccommodationMaxLength500 = "Preferred accommodation must not exceed 500 characters.";
    public const string TourRequestTransportationPreferenceMaxLength500 = "Transportation preference must not exceed 500 characters.";
    public const string TourRequestSpecialRequestsMaxLength2000 = "Special requests must not exceed 2000 characters.";
    public const string TourRequestReviewStatusRequired = "Review status is required.";
    public const string TourRequestReviewStatusInvalid = "Review status must be Approved or Rejected.";
    public const string TourRequestAdminNoteMaxLength2000 = "Admin note must not exceed 2000 characters.";

    // ── Payment ────────────────────────────────────────────────
    public const string PaymentBookingIdRequired = "Booking ID không được để trống.";
    public const string PaymentAmountGreaterThanZero = "Số tiền phải lớn hơn 0.";
    public const string PaymentContentRequired = "Nội dung thanh toán không được để trống.";
    public const string PaymentContentMaxLength500 = "Nội dung thanh toán không được vượt quá 500 ký tự.";
    public const string PaymentCreatorRequired = "Người tạo không được để trống.";
    public const string PaymentTransactionIdRequired = "Mã giao dịch không được để trống.";
    public const string PaymentTransferContentRequired = "Nội dung chuyển khoản không được để trống.";
    public const string GetQRContentRequired = "Nội dung chuyển khoản không được để trống.";
    public const string GetQRAmountGreaterThanZero = "Số tiền phải lớn hơn 0.";

    // ── DepositPolicy ─────────────────────────────────────────
    public const string DepositPolicyScopeRange = "Tour scope must be 1 (Domestic) or 2 (International).";
    public const string DepositPolicyTypeRange = "Deposit type must be 1 (Percentage) or 2 (Fixed Amount).";
    public const string DepositPolicyValueGreaterThanZero = "Deposit value must be greater than 0.";
    public const string DepositPolicyMinDaysNonNegative = "Min days cannot be negative.";
    public const string DepositPolicyIdRequired = "ID is required.";

    // ── CancellationPolicy ─────────────────────────────────────
    public const string CancellationPolicyTourScopeInvalid = "Invalid tour scope";
    public const string CancellationPolicyTiersRequired = "Tiers are required";
    public const string CancellationPolicyTiersMinOne = "At least one tier is required";
    public const string CancellationPolicyTierMinDaysNonNegative = "Min days must be >= 0";
    public const string CancellationPolicyTierMaxDaysGreaterThanMinDays = "Max days must be >= min days";
    public const string CancellationPolicyTierPenaltyPercentageRange = "Penalty percentage must be between 0 and 100";
    public const string CancellationPolicyStatusInvalid = "Invalid status";
    public const string CancellationPolicyIdRequired = "ID is required";

    // ── VisaPolicy ─────────────────────────────────────────────
    public const string VisaPolicyRegionRequired = "Region is required.";
    public const string VisaPolicyRegionMaxLength100 = "Region must not exceed 100 characters.";
    public const string VisaPolicyProcessingDaysGreaterThanZero = "Processing days must be greater than 0.";
    public const string VisaPolicyBufferDaysNonNegative = "Buffer days cannot be negative.";
    public const string VisaPolicyIdRequired = "ID is required.";

    // ── TaxConfig ──────────────────────────────────────────────
    public const string TaxConfigNameRequired = "Tax name is required.";
    public const string TaxConfigRateNonNegative = "Tax rate cannot be negative.";
    public const string TaxConfigRateMax100 = "Tax rate cannot exceed 100%.";
    public const string TaxConfigEffectiveDateRequired = "Effective date is required.";
    public const string TaxConfigIdRequired = "ID is required.";

    // ── PricingPolicy ──────────────────────────────────────────
    public const string PricingPolicyIdRequired = "Policy ID is required.";
    public const string PricingPolicyNameRequired = "Policy name is required.";
    public const string PricingPolicyTiersMinOne = "At least one pricing tier is required.";
    public const string PricingPolicyTierLabelRequired = "Tier label is required.";
    public const string PricingPolicyTierAgeFromNonNegative = "Age from must be non-negative.";
    public const string PricingPolicyTierPricePercentageRange = "Price percentage must be between 0 and 100.";
    public const string PricingPolicyTierAgeToGreaterThanOrEqualAgeFrom = "Age to must be greater than or equal to age from.";

    // ── TourInstance ────────────────────────────────────────────
    public const string TourInstanceGuideIdsNotDuplicate = "Guide IDs không được trùng nhau.";
    public const string TourInstanceManagerIdsNotDuplicate = "Manager IDs không được trùng nhau.";
    public const string TourInstanceUserCannotBeBothGuideAndManager = "Một user không thể vừa là Guide vừa là Manager.";

    // ── Tour Detail ─────────────────────────────────────────────
    // Image
    public const string ImageFileIdRequired = "Thumbnail file ID is required.";
    public const string ImageOriginalFileNameRequired = "Original file name is required.";
    public const string ImageFileNameRequired = "File name is required.";
    public const string ImagePublicUrlRequired = "Public URL is required.";
    public const string ImagePublicUrlInvalid = "Public URL must be a valid URL.";

    // Classification
    public const string ClassificationNameRequired = "Classification name is required.";
    public const string ClassificationNameMaxLength200 = "Classification name must not exceed 200 characters.";
    public const string ClassificationDescriptionMaxLength1000 = "Classification description must not exceed 1000 characters.";
    public const string ClassificationBasePriceNonNegative = "Base price must be greater than or equal to 0.";
    public const string ClassificationNumberOfDaysPositive = "Number of days must be greater than 0.";
    public const string ClassificationNumberOfNightsNonNegative = "Number of nights must be greater than or equal to 0.";

    // DayPlan
    public const string DayPlanDayNumberPositive = "Day number must be greater than 0.";
    public const string DayPlanTitleRequired = "Day plan title is required.";
    public const string DayPlanTitleMaxLength200 = "Day plan title must not exceed 200 characters.";
    public const string DayPlanDescriptionMaxLength2000 = "Day plan description must not exceed 2000 characters.";

    // Activity
    public const string ActivityTypeRequired = "Activity type is required.";
    public const string ActivityTitleRequired = "Activity title is required.";
    public const string ActivityTitleMaxLength200 = "Activity title must not exceed 200 characters.";
    public const string ActivityDescriptionMaxLength1000 = "Activity description must not exceed 1000 characters.";
    public const string ActivityEstimatedCostNonNegative = "Estimated cost must be greater than or equal to 0.";
    public const string ActivityResourceLinkInvalid = "Each resource link must be a valid absolute URL with http or https scheme (e.g., https://example.com).";
    public const string ActivityResourceLinkMaxLength2048 = "Each resource link URL must not exceed 2048 characters.";

    // Route / Transportation shared
    public const string TransportationTypeRequired = "Transportation type is required.";
    public const string RouteFromLocationNameRequired = "From location name is required when FromLocationId is not provided.";
    public const string RouteToLocationNameRequired = "To location name is required when ToLocationId is not provided.";
    public const string RouteDurationNonNegative = "Duration must be greater than or equal to 0.";
    public const string RoutePriceNonNegative = "Route price must be greater than or equal to 0.";
    public const string TransportationNameMaxLength300 = "Transportation name must not exceed 300 characters.";
    public const string TransportationTicketInfoMaxLength500 = "Ticket info must not exceed 500 characters.";
    public const string TransportationNoteMaxLength1000 = "Note must not exceed 1000 characters.";
    public const string TransportationPriceNonNegative = "Transportation price must be greater than or equal to 0.";

    // Accommodation
    public const string AccommodationNameRequired = "Accommodation name is required.";
    public const string AccommodationNameMaxLength200 = "Accommodation name must not exceed 200 characters.";
    public const string AccommodationAddressMaxLength500 = "Address must not exceed 500 characters.";
    public const string AccommodationCheckInTimeMaxLength50 = "Check-in time must not exceed 50 characters.";
    public const string AccommodationCheckOutTimeMaxLength50 = "Check-out time must not exceed 50 characters.";
    public const string AccommodationRoomTypeMaxLength50 = "Room type must not exceed 50 characters.";
    public const string AccommodationRoomCapacityPositive = "Room capacity must be greater than 0.";
    public const string AccommodationNumberOfRoomsRange = "Number of rooms must be between 1 and 999.";
    public const string AccommodationNumberOfNightsRange = "Number of nights must be between 1 and 999.";
    public const string AccommodationRoomPriceNonNegative = "Room price must be greater than or equal to 0.";
    public const string AccommodationLatitudeRange = "Latitude must be between -90 and 90.";
    public const string AccommodationLongitudeRange = "Longitude must be between -180 and 180.";
    public const string AccommodationSpecialRequestMaxLength1000 = "Special request must not exceed 1000 characters.";
    public const string AccommodationMealsIncludedMaxLength100 = "Meals included must not exceed 100 characters.";

    // Insurance
    public const string InsuranceNameRequired = "Insurance name is required.";
    public const string InsuranceNameMaxLength200 = "Insurance name must not exceed 200 characters.";
    public const string InsuranceTypeRequired = "Insurance type is required.";
    public const string InsuranceProviderMaxLength200 = "Insurance provider must not exceed 200 characters.";
    public const string InsuranceCoverageDescriptionMaxLength1000 = "Coverage description must not exceed 1000 characters.";
    public const string InsuranceCoverageAmountNonNegative = "Coverage amount must be greater than or equal to 0.";
    public const string InsuranceCoverageFeeNonNegative = "Coverage fee must be greater than or equal to 0.";

    // Location
    public const string LocationNameRequired = "Location name is required.";
    public const string LocationNameMaxLength200 = "Location name must not exceed 200 characters.";
    public const string LocationTypeRequired = "Location type is required.";
    public const string LocationDescriptionMaxLength1000 = "Location description must not exceed 1000 characters.";
    public const string LocationCityMaxLength200 = "City must not exceed 200 characters.";
    public const string LocationCountryMaxLength200 = "Country must not exceed 200 characters.";
    public const string LocationEntranceFeeNonNegative = "Entrance fee must be greater than or equal to 0.";
    public const string LocationAddressMaxLength500 = "Address must not exceed 500 characters.";

    // Service
    public const string ServiceNameRequired = "Service name is required.";
    public const string ServiceNameMaxLength200 = "Service name must not exceed 200 characters.";
    public const string ServicePriceNonNegative = "Price must be greater than or equal to 0.";
    public const string ServiceSalePriceNonNegative = "Sale price must be greater than or equal to 0.";
    public const string ServiceEmailInvalid = "Invalid email format.";

    // Tour scope/segment
    public const string TourScopeInvalid = "Tour scope must be a valid value.";
    public const string CustomerSegmentInvalid = "Customer segment must be a valid value.";

    // Tour nested list minimums
    public const string TourClassificationsMinOne = "At least one classification is required when Classifications are provided.";
    public const string TourImagesMinOne = "At least one image is required when Images are provided.";
    public const string TourAccommodationsMinOne = "At least one accommodation is required when Accommodations are provided.";
    public const string TourLocationsMinOne = "At least one location is required when Locations are provided.";
    public const string TourTransportationsMinOne = "At least one transportation is required when Transportations are provided.";
    public const string TourServicesMinOne = "At least one service is required when Services are provided.";

    // Deleted IDs
    public const string DeletedClassificationIdRequired = "Deleted classification ID cannot be empty.";
    public const string DeletedActivityIdRequired = "Deleted activity ID cannot be empty.";

    // ── Public Booking ─────────────────────────────────────────
    public const string PublicBookingCustomerNameRequired = "Tên khách hàng không được để trống.";
    public const string PublicBookingCustomerNameMaxLength200 = "Tên khách hàng không được vượt quá 200 ký tự.";
    public const string PublicBookingCustomerPhoneRequired = "Số điện thoại không được để trống.";
    public const string PublicBookingCustomerPhoneInvalid = "Số điện thoại không hợp lệ.";
    public const string PublicBookingCustomerEmailInvalid = "Email không hợp lệ.";
    public const string PublicBookingAdultsGreaterThanZero = "Số người lớn phải lớn hơn 0.";
    public const string PublicBookingChildNonNegative = "Số trẻ em không được âm.";
    public const string PublicBookingInfantNonNegative = "Số em bé không được âm.";
    public const string PublicBookingPaymentMethodInvalid = "Phương thức thanh toán không hợp lệ.";
}
