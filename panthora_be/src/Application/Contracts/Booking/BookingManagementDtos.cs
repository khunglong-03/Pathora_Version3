using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Contracts.Booking;

public sealed record SupplierDto(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("supplierType")] SupplierType SupplierType,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("isActive")] bool IsActive
);

public sealed record CreateSupplierDto(
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("supplierType")] SupplierType SupplierType,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("primaryContinent")] Continent? PrimaryContinent
);

public sealed record UpdateSupplierDto(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("supplierType")] SupplierType SupplierType,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("isActive")] bool IsActive
);

public sealed record BookingActivityReservationDto(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("order")] int Order,
    [property: JsonPropertyName("activityType")] string ActivityType,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startTime")] DateTimeOffset? StartTime,
    [property: JsonPropertyName("endTime")] DateTimeOffset? EndTime,
    [property: JsonPropertyName("totalServicePrice")] decimal TotalServicePrice,
    [property: JsonPropertyName("totalServicePriceAfterTax")] decimal TotalServicePriceAfterTax,
    [property: JsonPropertyName("status")] ReservationStatus Status,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record TransportDetailDto(
    [property: JsonPropertyName("bookingTransportDetailId")] Guid BookingTransportDetailId,
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("bookingParticipantId")] Guid? BookingParticipantId,
    [property: JsonPropertyName("passengerName")] string? PassengerName,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("transportType")] TransportType TransportType,
    [property: JsonPropertyName("departureAt")] DateTimeOffset? DepartureAt,
    [property: JsonPropertyName("arrivalAt")] DateTimeOffset? ArrivalAt,
    [property: JsonPropertyName("ticketNumber")] string? TicketNumber,
    [property: JsonPropertyName("eTicketNumber")] string? ETicketNumber,
    [property: JsonPropertyName("seatNumber")] string? SeatNumber,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("seatClass")] string? SeatClass,
    [property: JsonPropertyName("vehicleNumber")] string? VehicleNumber,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("totalBuyPrice")] decimal TotalBuyPrice,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("status")] ReservationStatus Status,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record CreateTransportDetailDto(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("bookingParticipantId")] Guid? BookingParticipantId,
    [property: JsonPropertyName("passengerName")] string? PassengerName,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("transportType")] TransportType TransportType,
    [property: JsonPropertyName("departureAt")] DateTimeOffset? DepartureAt,
    [property: JsonPropertyName("arrivalAt")] DateTimeOffset? ArrivalAt,
    [property: JsonPropertyName("ticketNumber")] string? TicketNumber,
    [property: JsonPropertyName("eTicketNumber")] string? ETicketNumber,
    [property: JsonPropertyName("seatNumber")] string? SeatNumber,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("seatClass")] string? SeatClass,
    [property: JsonPropertyName("vehicleNumber")] string? VehicleNumber,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record AccommodationDetailDto(
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid BookingAccommodationDetailId,
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCount")] int RoomCount,
    [property: JsonPropertyName("bedType")] string? BedType,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("checkInAt")] DateTimeOffset? CheckInAt,
    [property: JsonPropertyName("checkOutAt")] DateTimeOffset? CheckOutAt,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("totalBuyPrice")] decimal TotalBuyPrice,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("confirmationCode")] string? ConfirmationCode,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("status")] ReservationStatus Status,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record CreateAccommodationDetailDto(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId,
    [property: JsonPropertyName("accommodationName")] string AccommodationName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("roomCount")] int RoomCount,
    [property: JsonPropertyName("bedType")] string? BedType,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("checkInAt")] DateTimeOffset? CheckInAt,
    [property: JsonPropertyName("checkOutAt")] DateTimeOffset? CheckOutAt,
    [property: JsonPropertyName("buyPrice")] decimal BuyPrice,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("isTaxable")] bool IsTaxable,
    [property: JsonPropertyName("confirmationCode")] string? ConfirmationCode,
    [property: JsonPropertyName("fileUrl")] string? FileUrl,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record PassportDto(
    [property: JsonPropertyName("passportId")] Guid PassportId,
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("passportNumber")] string PassportNumber,
    [property: JsonPropertyName("nationality")] string? Nationality,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset? IssuedAt,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt,
    [property: JsonPropertyName("fileUrl")] string? FileUrl
);

public sealed record CreatePassportDto(
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("passportNumber")] string PassportNumber,
    [property: JsonPropertyName("nationality")] string? Nationality,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset? IssuedAt,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt,
    [property: JsonPropertyName("fileUrl")] string? FileUrl
);

public sealed record VisaDto(
    [property: JsonPropertyName("visaId")] Guid VisaId,
    [property: JsonPropertyName("visaApplicationId")] Guid VisaApplicationId,
    [property: JsonPropertyName("visaNumber")] string? VisaNumber,
    [property: JsonPropertyName("country")] string? Country,
    [property: JsonPropertyName("status")] VisaStatus Status,
    [property: JsonPropertyName("entryType")] VisaEntryType? EntryType,
    [property: JsonPropertyName("issuedAt")] DateTimeOffset? IssuedAt,
    [property: JsonPropertyName("expiresAt")] DateTimeOffset? ExpiresAt,
    [property: JsonPropertyName("fileUrl")] string? FileUrl
);

public sealed record VisaApplicationDto(
    [property: JsonPropertyName("visaApplicationId")] Guid VisaApplicationId,
    [property: JsonPropertyName("bookingParticipantId")] Guid BookingParticipantId,
    [property: JsonPropertyName("passportId")] Guid PassportId,
    [property: JsonPropertyName("destinationCountry")] string DestinationCountry,
    [property: JsonPropertyName("status")] VisaStatus Status,
    [property: JsonPropertyName("minReturnDate")] DateTimeOffset? MinReturnDate,
    [property: JsonPropertyName("refusalReason")] string? RefusalReason,
    [property: JsonPropertyName("visaFileUrl")] string? VisaFileUrl,
    [property: JsonPropertyName("visa")] VisaDto? Visa
);

public sealed record ParticipantDto(
    [property: JsonPropertyName("participantId")] Guid ParticipantId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("participantType")] string ParticipantType,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("dateOfBirth")] DateTimeOffset? DateOfBirth,
    [property: JsonPropertyName("gender")] GenderType? Gender,
    [property: JsonPropertyName("nationality")] string? Nationality,
    [property: JsonPropertyName("status")] ReservationStatus Status,
    [property: JsonPropertyName("passport")] PassportDto? Passport,
    [property: JsonPropertyName("visaApplications")] List<VisaApplicationDto> VisaApplications
);

public sealed record CreateParticipantDto(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("participantType")] string ParticipantType,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("dateOfBirth")] DateTimeOffset? DateOfBirth,
    [property: JsonPropertyName("gender")] GenderType? Gender,
    [property: JsonPropertyName("nationality")] string? Nationality
);

public sealed record SupplierReceiptDto(
    [property: JsonPropertyName("supplierReceiptId")] Guid SupplierReceiptId,
    [property: JsonPropertyName("supplierPayableId")] Guid SupplierPayableId,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("paidAt")] DateTimeOffset PaidAt,
    [property: JsonPropertyName("paymentMethod")] PaymentMethod PaymentMethod,
    [property: JsonPropertyName("transactionRef")] string? TransactionRef,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record SupplierPayableDto(
    [property: JsonPropertyName("supplierPayableId")] Guid SupplierPayableId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("expectedAmount")] decimal ExpectedAmount,
    [property: JsonPropertyName("paidAmount")] decimal PaidAmount,
    [property: JsonPropertyName("dueAt")] DateTimeOffset? DueAt,
    [property: JsonPropertyName("status")] PaymentStatus Status,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("receipts")] List<SupplierReceiptDto> Receipts
);


public sealed record BookingTeamMemberDto(
    [property: JsonPropertyName("bookingTourGuideId")] Guid BookingTourGuideId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("assignedRole")] AssignedRole AssignedRole,
    [property: JsonPropertyName("isLead")] bool IsLead,
    [property: JsonPropertyName("status")] AssignmentStatus Status,
    [property: JsonPropertyName("assignedDate")] DateTimeOffset AssignedDate,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record AssignTeamMemberDto(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("assignedRole")] AssignedRole AssignedRole,
    [property: JsonPropertyName("isLead")] bool IsLead,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record BookingTourGuideDto(
    [property: JsonPropertyName("bookingTourGuideId")] Guid BookingTourGuideId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("assignedRole")] AssignedRole AssignedRole,
    [property: JsonPropertyName("isLead")] bool IsLead,
    [property: JsonPropertyName("status")] AssignmentStatus Status,
    [property: JsonPropertyName("assignedDate")] DateTimeOffset AssignedDate,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record TourDayActivityGuideDto(
    [property: JsonPropertyName("tourDayActivityGuideId")] Guid TourDayActivityGuideId,
    [property: JsonPropertyName("tourDayActivityStatusId")] Guid TourDayActivityStatusId,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("role")] GuideRole Role,
    [property: JsonPropertyName("checkInTime")] DateTimeOffset? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] DateTimeOffset? CheckOutTime,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record TourDayActivityStatusDto(
    [property: JsonPropertyName("tourDayActivityStatusId")] Guid TourDayActivityStatusId,
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("activityStatus")] ActivityStatus ActivityStatus,
    [property: JsonPropertyName("actualStartTime")] DateTimeOffset? ActualStartTime,
    [property: JsonPropertyName("actualEndTime")] DateTimeOffset? ActualEndTime,
    [property: JsonPropertyName("completedAt")] DateTimeOffset? CompletedAt,
    [property: JsonPropertyName("cancellationReason")] string? CancellationReason,
    [property: JsonPropertyName("cancelledAt")] DateTimeOffset? CancelledAt,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("guides")] List<TourDayActivityGuideDto> Guides
);

public sealed record UpdateActivityStatusDto(
    [property: JsonPropertyName("actualTime")] DateTimeOffset? ActualTime,
    [property: JsonPropertyName("reason")] string? Reason,
    [property: JsonPropertyName("note")] string? Note
);

public sealed record CreateBookingRequest(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("customerPhone")] string CustomerPhone,
    [property: JsonPropertyName("customerEmail")] string? CustomerEmail,
    [property: JsonPropertyName("numberAdult")] int NumberAdult,
    [property: JsonPropertyName("numberChild")] int NumberChild,
    [property: JsonPropertyName("numberInfant")] int NumberInfant,
    [property: JsonPropertyName("totalPrice")] decimal TotalPrice,
    [property: JsonPropertyName("paymentMethod")] PaymentMethod PaymentMethod,
    [property: JsonPropertyName("isFullPay")] bool IsFullPay,
    [property: JsonPropertyName("participants")] List<CreateParticipantDto>? Participants
);

public sealed record BookingDetailResponse(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("customerPhone")] string CustomerPhone,
    [property: JsonPropertyName("customerEmail")] string? CustomerEmail,
    [property: JsonPropertyName("numberAdult")] int NumberAdult,
    [property: JsonPropertyName("numberChild")] int NumberChild,
    [property: JsonPropertyName("numberInfant")] int NumberInfant,
    [property: JsonPropertyName("totalPrice")] decimal TotalPrice,
    [property: JsonPropertyName("status")] BookingStatus Status,
    [property: JsonPropertyName("activityReservations")] List<BookingActivityReservationDto> ActivityReservations,
    [property: JsonPropertyName("transportDetails")] List<TransportDetailDto> TransportDetails,
    [property: JsonPropertyName("accommodationDetails")] List<AccommodationDetailDto> AccommodationDetails,
    [property: JsonPropertyName("participants")] List<ParticipantDto> Participants,
    [property: JsonPropertyName("supplierPayables")] List<SupplierPayableDto> SupplierPayables,
    [property: JsonPropertyName("assignedTourGuides")] List<BookingTourGuideDto> AssignedTourGuides,
    [property: JsonPropertyName("activityStatuses")] List<TourDayActivityStatusDto> ActivityStatuses
);

public sealed record CheckoutPriceResponse(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("tourCode")] string TourCode,
    [property: JsonPropertyName("thumbnailUrl")] string? ThumbnailUrl,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("durationDays")] int DurationDays,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("numberAdult")] int NumberAdult,
    [property: JsonPropertyName("numberChild")] int NumberChild,
    [property: JsonPropertyName("numberInfant")] int NumberInfant,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("childPrice")] decimal? ChildPrice,
    [property: JsonPropertyName("infantPrice")] decimal? InfantPrice,
    [property: JsonPropertyName("adultSubtotal")] decimal AdultSubtotal,
    [property: JsonPropertyName("childSubtotal")] decimal ChildSubtotal,
    [property: JsonPropertyName("infantSubtotal")] decimal InfantSubtotal,
    [property: JsonPropertyName("subtotal")] decimal Subtotal,
    [property: JsonPropertyName("taxRate")] decimal TaxRate,
    [property: JsonPropertyName("taxAmount")] decimal TaxAmount,
    [property: JsonPropertyName("totalPrice")] decimal TotalPrice,
    [property: JsonPropertyName("depositPercentage")] decimal DepositPercentage,
    [property: JsonPropertyName("depositAmount")] decimal DepositAmount,
    [property: JsonPropertyName("remainingBalance")] decimal RemainingBalance
);

public sealed record AdminBookingListResponse(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("customerName")] string CustomerName,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("departureDate")] DateTimeOffset DepartureDate,
    [property: JsonPropertyName("totalPrice")] decimal TotalPrice,
    [property: JsonPropertyName("status")] string Status
);

public sealed record AdminBookingListResult(
    [property: JsonPropertyName("items")] List<AdminBookingListResponse> Items,
    [property: JsonPropertyName("totalCount")] int TotalCount
);

public sealed record RecentBookingResponse(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("departureDate")] DateTimeOffset DepartureDate,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("totalPrice")] decimal TotalPrice,
    [property: JsonPropertyName("totalParticipants")] int TotalParticipants
);

public sealed record UpdateTourStatusRequestDto([property: JsonPropertyName("status")] TourStatus Status);

public sealed record CreateSupplierWithOwnerDto(
    [property: JsonPropertyName("ownerEmail")] string OwnerEmail,
    [property: JsonPropertyName("ownerFullName")] string OwnerFullName,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("supplierType")] SupplierType SupplierType,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("primaryContinent")] Continent? PrimaryContinent
);

public sealed record CreateSupplierWithOwnerResponse(
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("ownerEmail")] string OwnerEmail
);
