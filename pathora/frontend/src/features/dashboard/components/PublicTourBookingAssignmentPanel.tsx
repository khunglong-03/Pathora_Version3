"use client";

/**
 * PublicTourBookingAssignmentPanel
 *
 * - Tour PUBLIC: gán phòng qua bảng booking (Gán KS) — một loại phòng/ booking,
 *   tổng phân bổ ≤ giới hạn phòng của tour; không phân bổ hàng loạt ở đây.
 * - Tour PRIVATE: phân bổ đầy đủ (nhiều loại phòng / booking) + vé phương tiện.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import TextInput from "@/components/ui/TextInput";
import type { AdminBookingListResponse } from "@/api/services/bookingService";
import ExternalTicketAssignmentPanel from "./ExternalTicketAssignmentPanel";
import type { BookingTicketEntry } from "./ExternalTicketAssignmentPanel";
import {
  tourInstanceService,
  type BookingRoomAssignmentDto,
} from "@/api/services/tourInstanceService";
import { supplierService, type SupplierItem } from "@/api/services/supplierService";
import { handleApiError } from "@/utils/apiResponse";
import { logTourOperatorEvent } from "@/utils/telemetry";

// ─── Types ────────────────────────────────────────────────────────────────────

/** @deprecated Dùng RoomAssignmentBookingState — giữ cho tương thích callback cũ. */
export interface RoomAssignmentEntry {
  bookingId: string;
  customerName: string;
  guestCount: number;
  roomsSuggested: number;
  roomCount: number;
  roomType: string;
  roomNumbers: string;
  note: string;
}

export interface RoomAssignmentLine {
  id?: string;
  clientId: string;
  roomType: string;
  roomCount: number;
  roomNumbers: string;
  note: string;
}

export interface RoomAssignmentBookingState {
  bookingId: string;
  customerName: string;
  guestCount: number;
  roomsSuggested: number;
  lines: RoomAssignmentLine[];
}

interface AccommodationActivityInfo {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  /** Tổng phòng đã block (hotel đã duyệt) */
  roomBlocksTotal: number;
  /** Số phòng yêu cầu của activity */
  quantity: number;
  roomType: string | null;
  supplierId?: string | null;
  supplierName: string | null;
  supplierApprovalStatus: string | null;
}

interface ExternalTransportActivityInfo {
  activityId: string;
  title: string;
  date: string;
  dayNumber: number;
  transportType: "Flight" | "Train" | "Boat" | "Bus" | "Car";
  confirmed: boolean;
}

interface Props {
  instanceId: string;
  instanceType: string;
  bookings: AdminBookingListResponse[];
  bookingsLoading: boolean;
  accommodationActivities: AccommodationActivityInfo[];
  externalTransportActivities: ExternalTransportActivityInfo[];
  /** Continent enum value của tour — dùng filter danh sách hotel supplier theo khu vực */
  continent?: number | null;
  onSaveTicket?: (activityId: string, entry: BookingTicketEntry) => Promise<void>;
  onConfirmExternalTransport?: (activityId: string, departureTime?: string, arrivalTime?: string) => Promise<void>;
  /** Save 1 booking room assignment to backend */
  onSaveRoomAssignment?: (
    activityId: string,
    payload: {
      bookingId: string;
      roomType: string;
      roomCount: number;
      roomNumbers?: string | null;
      note?: string | null;
    },
  ) => Promise<void>;
  /** Load existing assignments for an activity */
  onLoadRoomAssignments?: (activityId: string) => Promise<BookingRoomAssignmentDto[]>;
  /** Notify parent after a room assignment has been saved successfully. */
  onRoomAssignmentSaved?: (activityId: string, bookingId: string) => void;
  /** Lưu yêu cầu phòng (supplier + roomType + quantity) cho activity. */
  onSetAccommodationRequirements?: (
    activityId: string,
    payload: { supplierId?: string | null; roomType: string; quantity: number },
  ) => Promise<void>;
  /** Sau khi yêu cầu phòng được lưu — parent sẽ refetch để cập nhật trạng thái supplier. */
  onRequirementsSaved?: () => void;
  /**
   * public-overview: chỉ thiết lập NCC/số phòng (không list phân bổ từng booking).
   * public-single: một booking — loại phòng cố định theo tour, chỉ nhập số phòng.
   * private-full: UI đầy đủ (mặc định).
   */
  accommodationUiMode?: "public-overview" | "public-single" | "private-full";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ước lượng số phòng theo loại phòng và số khách */
function suggestRoomCount(adults: number, children: number, roomType: string): number {
  const total = adults + Math.ceil(children / 2);
  const capacityByType: Record<string, number> = {
    single: 1,
    double: 2,
    twin: 2,
    triple: 3,
    quad: 4,
    family: 4,
    suite: 2,
    dormitory: 8,
    villa: 6,
    standard: 2,
    deluxe: 2,
    vip: 2,
    other: 2,
  };
  const cap = capacityByType[roomType?.toLowerCase()] ?? 2;
  return Math.max(1, Math.ceil(total / cap));
}

// ─── Sub-component: Accommodation per-booking ─────────────────────────────────

const FALLBACK_ROOM_TYPES = [
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quad",
  "Family",
  "Suite",
  "Dormitory",
  "Standard",
  "Deluxe",
];

const ROOM_TYPE_SELECT_OPTIONS = [
  ...FALLBACK_ROOM_TYPES,
  "Villa",
  "VIP",
  "Other",
];

const newLineClientId = () =>
  `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createRoomLine = (
  roomType: string,
  roomCount: number,
  partial?: Partial<RoomAssignmentLine>,
): RoomAssignmentLine => ({
  clientId: newLineClientId(),
  roomType,
  roomCount,
  roomNumbers: "",
  note: "",
  ...partial,
});

const sumLineRoomCount = (lines: RoomAssignmentLine[]) =>
  lines.reduce((sum, line) => sum + (line.roomCount > 0 ? line.roomCount : 0), 0);

function AccommodationBookingCard({
  activity,
  instanceId,
  bookings,
  continent,
  accommodationUiMode = "private-full",
  onSaveRoomAssignment,
  onLoadRoomAssignments,
  onRoomAssignmentSaved,
  onSetAccommodationRequirements,
  onRequirementsSaved,
}: {
  activity: AccommodationActivityInfo;
  instanceId: string;
  bookings: AdminBookingListResponse[];
  continent?: number | null;
  accommodationUiMode?: Props["accommodationUiMode"];
  onSaveRoomAssignment?: Props["onSaveRoomAssignment"];
  onLoadRoomAssignments?: Props["onLoadRoomAssignments"];
  onRoomAssignmentSaved?: Props["onRoomAssignmentSaved"];
  onSetAccommodationRequirements?: Props["onSetAccommodationRequirements"];
  onRequirementsSaved?: Props["onRequirementsSaved"];
}) {
  const isPublicSingle = accommodationUiMode === "public-single";
  const isPublicOverview = accommodationUiMode === "public-overview";
  const showPerBookingAllocation =
    accommodationUiMode === "private-full" && bookings.length > 0;
  const { t } = useTranslation();
  // ─── Inline supplier picker state (Tour Operator chọn khách sạn cho activity) ──
  const totalGuests = useMemo(
    () =>
      bookings.reduce(
        (sum, b) =>
          sum + (b.numberAdult ?? 0) + (b.numberChild ?? 0) + (b.numberInfant ?? 0),
        0,
      ),
    [bookings],
  );
  const suggestedQuantity = useMemo(
    () =>
      activity.quantity > 0 ? activity.quantity : Math.max(1, Math.ceil(totalGuests / 2)),
    [activity.quantity, totalGuests],
  );
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [picker, setPicker] = useState({
    supplierId: activity.supplierId ?? "",
    roomType: activity.roomType ?? "",
    quantity: suggestedQuantity,
    isSubmitting: false,
  });

  const tourRoomType = activity.roomType || "Standard";
  const activeRoomType = isPublicSingle
    ? tourRoomType
    : picker.roomType || tourRoomType;
  const [savedBookingIds, setSavedBookingIds] = useState<Set<string>>(new Set());
  const assignmentIdsByBookingRef = useRef<Record<string, Set<string>>>({});

  const buildDefaultBookingState = useCallback(
    (booking: AdminBookingListResponse): RoomAssignmentBookingState => {
      const adults = booking.numberAdult ?? 0;
      const children = booking.numberChild ?? 0;
      const guestCount = adults + children + (booking.numberInfant ?? 0);
      const suggested =
        bookings.length === 1 && picker.quantity > 0
          ? picker.quantity
          : suggestRoomCount(adults, children, activeRoomType);
      return {
        bookingId: booking.id,
        customerName: booking.customerName,
        guestCount,
        roomsSuggested: suggested,
        lines: [createRoomLine(activeRoomType, suggested)],
      };
    },
    [activeRoomType, bookings.length, picker.quantity],
  );

  const [bookingStates, setBookingStates] = useState<Record<string, RoomAssignmentBookingState>>(
    () => {
      const init: Record<string, RoomAssignmentBookingState> = {};
      for (const b of bookings) {
        init[b.id] = buildDefaultBookingState(b);
      }
      return init;
    },
  );

  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);


  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supplierAccommodations, setSupplierAccommodations] = useState<
    Array<{ roomType: string; name?: string; totalRooms?: number }>
  >([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(false);

  // Load existing assignments
  useEffect(() => {
    if (!onLoadRoomAssignments) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await onLoadRoomAssignments(activity.activityId);
        if (cancelled) return;
        if (existing.length === 0) return;
        const grouped = new Map<string, RoomAssignmentLine[]>();
        const idsByBooking: Record<string, Set<string>> = {};
        for (const dto of existing) {
          const roomType =
            typeof dto.roomType === "string" ? dto.roomType : String(dto.roomType);
          const lines = grouped.get(dto.bookingId) ?? [];
          lines.push(
            createRoomLine(roomType, dto.roomCount, {
              id: dto.id,
              roomNumbers: dto.roomNumbers ?? "",
              note: dto.note ?? "",
            }),
          );
          grouped.set(dto.bookingId, lines);
          const idSet = idsByBooking[dto.bookingId] ?? new Set<string>();
          idSet.add(dto.id);
          idsByBooking[dto.bookingId] = idSet;
        }

        if (isPublicSingle) {
          for (const [bookingId, lines] of grouped.entries()) {
            if (lines.length <= 1) continue;
            const mergedCount = lines.reduce((sum, line) => sum + line.roomCount, 0);
            grouped.set(bookingId, [
              createRoomLine(tourRoomType, mergedCount, {
                id: lines[0]?.id,
                roomNumbers: lines.map((l) => l.roomNumbers).filter(Boolean).join(", "),
                note: lines.map((l) => l.note).filter(Boolean).join("; "),
              }),
            ]);
          }
        }
        assignmentIdsByBookingRef.current = idsByBooking;

        setBookingStates((prev) => {
          const next = { ...prev };
          for (const b of bookings) {
            const lines = grouped.get(b.id);
            if (!lines || lines.length === 0) continue;
            next[b.id] = {
              ...(next[b.id] ?? buildDefaultBookingState(b)),
              lines,
            };
          }
          return next;
        });
        setSavedBookingIds(new Set(grouped.keys()));
      } catch {
        if (cancelled) return;
        setLoadError(
          t(
            "tourInstance.bookingHotel.loadAssignmentsError",
            "Không thể tải phân bổ đã lưu trước đó",
          ),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    activity.activityId,
    bookings,
    buildDefaultBookingState,
    isPublicSingle,
    onLoadRoomAssignments,
    t,
    tourRoomType,
  ]);

  // Đã có supplier hợp lệ chưa? Dùng để quyết định có hiển thị inline picker hay không.
  const hasSupplierAssigned = Boolean(activity.supplierName) && activity.quantity > 0;
  const isRejectedSupplier = activity.supplierApprovalStatus?.toLowerCase() === "rejected";
  const showSupplierPicker =
    Boolean(onSetAccommodationRequirements)
    && (!hasSupplierAssigned || isRejectedSupplier || isEditingRequirements);

  const openRequirementsEditor = useCallback(() => {
    setPicker({
      supplierId: activity.supplierId ?? "",
      roomType: activity.roomType ?? "",
      quantity: Math.max(activity.quantity, suggestedQuantity, 1),
      isSubmitting: false,
    });
    setIsEditingRequirements(true);
  }, [activity.quantity, activity.roomType, activity.supplierId, suggestedQuantity]);

  // Lazy load danh sách hotel supplier theo continent của tour (chỉ chạy 1 lần khi picker hiện)
  const suppliersLoadedRef = React.useRef(false);
  useEffect(() => {
    if (!showSupplierPicker) return;
    if (suppliersLoadedRef.current) return;
    suppliersLoadedRef.current = true;
    setSuppliersLoading(true);
    supplierService
      .getSuppliers("Accommodation", continent ?? null)
      .then((list) => {
        setSuppliers(list);
      })
      .catch(() => {
        suppliersLoadedRef.current = false;
        toast.error(
          t(
            "tourInstance.bookingHotel.loadSuppliersError",
            "Không thể tải danh sách khách sạn",
          ),
        );
      })
      .finally(() => {
        setSuppliersLoading(false);
      });
  }, [showSupplierPicker, continent, t]);

  // Lazy load danh sách phòng theo supplier đã chọn (để render dropdown loại phòng cụ thể)
  useEffect(() => {
    if (!picker.supplierId) {
      setSupplierAccommodations([]);
      return;
    }
    let cancelled = false;
    setAccommodationsLoading(true);
    supplierService
      .getSupplierAccommodations(picker.supplierId)
      .then((list) => {
        if (cancelled) return;
        setSupplierAccommodations(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (cancelled) return;
        setSupplierAccommodations([]);
      })
      .finally(() => {
        setAccommodationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [picker.supplierId]);

  const handleSaveRequirements = async () => {
    if (!onSetAccommodationRequirements) return;
    if (!picker.roomType.trim()) {
      toast.warning(
        t(
          "tourInstance.bookingHotel.validation.roomTypeRequired",
          "Vui lòng chọn loại phòng.",
        ),
      );
      return;
    }
    if (picker.quantity <= 0) {
      toast.warning(
        t("tourInstance.bookingHotel.validation.roomCountPositive", "Số phòng phải lớn hơn 0"),
      );
      return;
    }
    setPicker((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await onSetAccommodationRequirements(activity.activityId, {
        supplierId: picker.supplierId || null,
        roomType: picker.roomType,
        quantity: picker.quantity,
      });
      toast.success(
        t(
          "tourInstance.bookingHotel.requirementsSaved",
          "Đã lưu yêu cầu khách sạn cho hoạt động này",
        ),
      );
      logTourOperatorEvent("booking_accommodation_requirements_set", {
        instanceId,
        activityId: activity.activityId,
        supplierId: picker.supplierId || null,
        roomType: picker.roomType,
        quantity: picker.quantity,
      });
      onRequirementsSaved?.();
      setIsEditingRequirements(false);
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setPicker((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const totalAssigned = useMemo(
    () =>
      Object.entries(bookingStates)
        .filter(([bookingId]) => savedBookingIds.has(bookingId))
        .reduce((sum, [, state]) => sum + sumLineRoomCount(state.lines), 0),
    [bookingStates, savedBookingIds],
  );

  const updateLine = useCallback(
    (
      bookingId: string,
      clientId: string,
      field: keyof Pick<RoomAssignmentLine, "roomType" | "roomCount" | "roomNumbers" | "note">,
      value: string | number,
    ) => {
      setBookingStates((prev) => {
        const state = prev[bookingId];
        if (!state) return prev;
        return {
          ...prev,
          [bookingId]: {
            ...state,
            lines: state.lines.map((line) =>
              line.clientId === clientId ? { ...line, [field]: value } : line,
            ),
          },
        };
      });
    },
    [],
  );

  const addRoomLine = useCallback(
    (bookingId: string) => {
      setBookingStates((prev) => {
        const state = prev[bookingId];
        if (!state) return prev;
        const usedTypes = new Set(state.lines.map((l) => l.roomType.toLowerCase()));
        const nextType =
          ROOM_TYPE_SELECT_OPTIONS.find((rt) => !usedTypes.has(rt.toLowerCase()))
          ?? "Standard";
        const remaining = Math.max(
          1,
          state.guestCount - sumLineRoomCount(state.lines),
        );
        return {
          ...prev,
          [bookingId]: {
            ...state,
            lines: [...state.lines, createRoomLine(nextType, remaining)],
          },
        };
      });
    },
    [],
  );

  const removeRoomLine = useCallback((bookingId: string, clientId: string) => {
    setBookingStates((prev) => {
      const state = prev[bookingId];
      if (!state || state.lines.length <= 1) return prev;
      return {
        ...prev,
        [bookingId]: {
          ...state,
          lines: state.lines.filter((line) => line.clientId !== clientId),
        },
      };
    });
  }, []);

  const handleSave = async (bookingId: string) => {
    if (savingId) return;
    const state = bookingStates[bookingId];
    if (!state) return;
    const booking = bookings.find((item) => item.id === bookingId);
    const bookingStatus = booking?.status?.toLowerCase() ?? "";
    const lockedByCheckIn =
      bookingStatus.includes("checkedin") ||
      bookingStatus.includes("checked_in") ||
      bookingStatus.includes("completed");

    if (lockedByCheckIn) {
      toast.warning(
        t(
          "tourInstance.bookingHotel.lockedAfterCheckIn",
          "Booking đã check-in, không thể sửa phân bổ khách sạn.",
        ),
      );
      return;
    }

    const linesToSave = isPublicSingle
      ? [
          createRoomLine(tourRoomType, state.lines[0]?.roomCount ?? 1, {
            roomNumbers: state.lines[0]?.roomNumbers ?? "",
            note: state.lines[0]?.note ?? "",
          }),
        ]
      : state.lines;

    if (!isPublicSingle) {
      const roomTypes = state.lines.map((l) => l.roomType.trim().toLowerCase());
      if (roomTypes.some((rt) => !rt)) {
        toast.warning(
          t(
            "tourInstance.bookingHotel.validation.roomTypeRequired",
            "Vui lòng chọn loại phòng cho từng dòng.",
          ),
        );
        return;
      }
      if (new Set(roomTypes).size !== roomTypes.length) {
        toast.warning(
          t(
            "tourInstance.bookingHotel.validation.duplicateRoomType",
            "Mỗi loại phòng chỉ được khai báo một lần trong cùng booking.",
          ),
        );
        return;
      }
    }

    const totalRooms = sumLineRoomCount(linesToSave);
    if (state.lines.some((l) => l.roomCount <= 0)) {
      toast.warning(
        t("tourInstance.bookingHotel.validation.roomCountPositive", "Số phòng phải lớn hơn 0"),
      );
      return;
    }

    if (totalRooms > state.guestCount) {
      toast.warning(
        t("tourInstance.bookingHotel.validation.roomCountTooHighTotal", {
          defaultValue:
            "Tổng số phòng ({{roomCount}}) không được vượt quá số khách ({{guestCount}}).",
          roomCount: totalRooms,
          guestCount: state.guestCount,
        }),
      );
      return;
    }

    const tourRoomCap =
      activity.roomBlocksTotal > 0 ? activity.roomBlocksTotal : activity.quantity;

    let otherAssigned = Object.entries(bookingStates)
      .filter(([id]) => id !== bookingId && savedBookingIds.has(id))
      .reduce((sum, [, other]) => sum + sumLineRoomCount(other.lines), 0);

    if (isPublicSingle && onLoadRoomAssignments) {
      try {
        const allRows = await onLoadRoomAssignments(activity.activityId);
        otherAssigned = allRows
          .filter((row) => row.bookingId !== bookingId)
          .reduce((sum, row) => sum + row.roomCount, 0);
      } catch {
        /* keep in-memory fallback */
      }
    }

    if (tourRoomCap > 0 && otherAssigned + totalRooms > tourRoomCap) {
      toast.error(
        t(
          isPublicSingle
            ? "tourInstance.bookingHotel.validation.exceedsTourRoomLimit"
            : "tourInstance.bookingHotel.validation.exceedsBlocked",
          {
            defaultValue: isPublicSingle
              ? "Tổng phòng đã gán cho tour ({{assigned}}) vượt quá giới hạn {{limit}} phòng của tour."
              : "Tổng số phòng phân bổ ({{assigned}}) vượt quá số phòng đã giữ ({{blocked}}).",
            assigned: otherAssigned + totalRooms,
            limit: tourRoomCap,
            blocked: tourRoomCap,
          },
        ),
      );
      return;
    }

    if (!onSaveRoomAssignment) {
      toast.warning(
        t("tourInstance.bookingHotel.saveUnavailable", "Chức năng lưu chưa được kết nối"),
      );
      return;
    }

    try {
      setSavingId(bookingId);
      const previousIds = assignmentIdsByBookingRef.current[bookingId] ?? new Set<string>();
      for (const id of previousIds) {
        if (!state.lines.some((line) => line.id === id)) {
          await tourInstanceService.deleteBookingRoomAssignment(
            instanceId,
            activity.activityId,
            id,
          );
        }
      }

      for (const line of linesToSave) {
        await onSaveRoomAssignment(activity.activityId, {
          bookingId: state.bookingId,
          roomType: line.roomType,
          roomCount: line.roomCount,
          roomNumbers: line.roomNumbers.trim() || null,
          note: line.note.trim() || null,
        });
      }

      if (onLoadRoomAssignments) {
        const refreshed = await onLoadRoomAssignments(activity.activityId);
        const grouped = refreshed.filter((d) => d.bookingId === bookingId);
        const nextIds = new Set(grouped.map((d) => d.id));
        assignmentIdsByBookingRef.current[bookingId] = nextIds;
        setBookingStates((prev) => ({
          ...prev,
          [bookingId]: {
            ...state,
            lines: grouped.map((dto) =>
              createRoomLine(
                typeof dto.roomType === "string" ? dto.roomType : String(dto.roomType),
                dto.roomCount,
                {
                  id: dto.id,
                  roomNumbers: dto.roomNumbers ?? "",
                  note: dto.note ?? "",
                },
              ),
            ),
          },
        }));
      } else {
        assignmentIdsByBookingRef.current[bookingId] = new Set(
          state.lines.map((l) => l.id).filter((id): id is string => Boolean(id)),
        );
      }

      setSavedBookingIds((prev) => new Set([...prev, bookingId]));
      logTourOperatorEvent("booking_accommodation_assigned", {
        instanceId,
        bookingId: state.bookingId,
        activityId: activity.activityId,
        roomCount: totalRooms,
      });
      toast.success(
        t("tourInstance.bookingHotel.assignSuccess", {
          defaultValue: "Đã lưu phân bổ phòng cho {{customerName}}",
          customerName: state.customerName,
        }),
      );
      onRoomAssignmentSaved?.(activity.activityId, bookingId);
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(
          apiError.code === "409"
            ? "tourInstance.bookingHotel.assignConflict"
            : apiError.message,
          t(
            "tourInstance.bookingHotel.saveError",
            "Không thể lưu phân bổ phòng",
          ),
        ),
      );
    } finally {
      setSavingId(null);
    }
  };

  const allSaved = bookings.every((b) => savedBookingIds.has(b.id));
  const approvalStatus = activity.supplierApprovalStatus?.toLowerCase() ?? null;
  const isApproved = approvalStatus === "approved";
  const isRejected = approvalStatus === "rejected";
  const hasSupplier = Boolean(activity.supplierName);
  const hasQuantity = activity.quantity > 0;
  const hasRoomBlocks = activity.roomBlocksTotal > 0;
  const supplierNotAssigned = !hasSupplier || !hasQuantity;
  const approvedNoBlocks = isApproved && !hasRoomBlocks;
  const canAssign = true; // Always allow assignment to let operators plan room allocations before supplier booking
  const remaining = Math.max(0, activity.roomBlocksTotal - totalAssigned);

  const bookAccommodationUrl = `/tour-operator/tour-instances/public/${instanceId}/book-accommodation`;
  let blockerBanner:
    | {
        tone: "amber" | "orange" | "rose";
        title: string;
        message: string;
        actionLabel?: string;
        actionHref?: string;
      }
    | null = null;
  if (supplierNotAssigned && !showSupplierPicker) {
    blockerBanner = {
      tone: "amber",
      title: "Chưa giao khách sạn cho activity này",
      message: isPublicOverview
        ? "Chưa giao khách sạn cho activity này. Gán NCC và số phòng yêu cầu tại đây, sau đó dùng bảng booking trên trang chi tiết tour để gán phòng từng khách (Gán KS)."
        : "Activity vừa được tạo, chưa có hotel supplier (Quantity = 0). Bước 1: Manager giao khách sạn + nhập số phòng cần. Bước 2: Supplier approve + block phòng. Bước 3: Quay lại bảng booking và bấm Gán KS.",
      actionLabel: isPublicOverview ? undefined : "Đi tới trang giao khách sạn",
      actionHref: isPublicOverview ? undefined : bookAccommodationUrl,
    };
  } else if (isRejected && !showSupplierPicker) {
    blockerBanner = {
      tone: "rose",
      title: "Khách sạn đã từ chối activity này",
      message:
        "Manager cần đổi sang khách sạn khác hoặc thương lượng lại. Phòng chưa block, chưa thể phân bổ.",
      actionLabel: "Đổi khách sạn khác",
      actionHref: bookAccommodationUrl,
    };
  } else if (!isApproved && !supplierNotAssigned && !isRejected) {
    blockerBanner = {
      tone: "orange",
      title: "Đang chờ khách sạn duyệt",
      message: isPublicSingle
        ? "Khách sạn chưa duyệt. Sau khi duyệt và block phòng, bạn có thể lưu số phòng cho booking này."
        : "Khách sạn đã được giao nhưng supplier chưa approve. Sau khi duyệt + block phòng, dùng Gán KS trên bảng booking để gán phòng.",
    };
  } else if (approvedNoBlocks) {
    blockerBanner = {
      tone: "orange",
      title: "Khách sạn đã duyệt nhưng chưa block phòng",
      message:
        "Supplier đã approve nhưng roomBlocksTotal = 0. Liên hệ supplier để xác nhận block phòng trước khi phân bổ.",
    };
  }

  return (
    <div className="rounded-[1.5rem] border border-stone-200/50 bg-white overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-stone-300/80 hover:shadow-md">
      <div className="flex flex-col gap-6 p-6 lg:p-8 md:flex-row md:items-start md:justify-between">
        {/* ── LEFT: Activity info ── */}
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="bg-stone-100 text-stone-700 px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded">Ngày {activity.dayNumber}</span>
            <span className="text-sm font-medium text-stone-500">
              {activity.date ? new Date(activity.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isApproved
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
                  : activity.supplierApprovalStatus?.toLowerCase() === "rejected"
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20"
                  : supplierNotAssigned
                  ? "bg-stone-50 text-stone-500 ring-1 ring-stone-500/20"
                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20"
              }`}
            >
              {isApproved
                ? "Khách sạn đã duyệt"
                : activity.supplierApprovalStatus?.toLowerCase() === "rejected"
                ? "Khách sạn từ chối"
                : supplierNotAssigned
                ? "Chưa gán phòng"
                : "Chờ duyệt"}
            </span>
          </div>

          <h4 className="text-xl font-bold tracking-tight text-stone-800 leading-tight">{activity.title}</h4>


          {activity.supplierName && (
            <div className="mt-4 flex gap-3 text-sm flex-wrap">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 shadow-sm px-3.5 py-2">
                <span className="text-stone-500 font-medium">Khách sạn:</span>
                <span className="font-bold text-stone-800">{activity.supplierName}</span>
              </div>
              {activity.roomType && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 shadow-sm px-3.5 py-2">
                  <span className="text-stone-500 font-medium">Loại:</span>
                  <span className="font-bold text-stone-800">{activity.roomType}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-stone-200 shadow-sm px-3.5 py-2">
                <span className="text-stone-500 font-medium">Yêu cầu:</span>
                <span className="font-bold text-stone-800">{activity.quantity} phòng</span>
              </div>
              {onSetAccommodationRequirements && hasSupplierAssigned && !isRejectedSupplier && (
                <button
                  type="button"
                  onClick={openRequirementsEditor}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  <Icon icon="heroicons:adjustments-horizontal" className="size-3.5" />
                  {t("tourInstance.accommodation.editRequirements", "Sửa số phòng / NCC")}
                </button>
              )}
            </div>
          )}

          {totalAssigned > activity.quantity && activity.quantity > 0 && (
            <p className="mt-3 text-xs font-medium text-orange-700">
              {t(
                "tourInstance.accommodation.requirements.assignedExceedsQuantity",
                "Đã phân bổ {{assigned}} phòng nhưng chỉ yêu cầu {{quantity}} — hãy tăng số phòng hoặc thêm NCC khác.",
                { assigned: totalAssigned, quantity: activity.quantity },
              )}
            </p>
          )}

          {blockerBanner && (
            <div
              className={`mt-4 flex items-start gap-3 p-4 rounded-xl text-sm ${
                blockerBanner.tone === "rose"
                  ? "bg-rose-50/60 border border-rose-100 text-rose-800"
                  : blockerBanner.tone === "amber"
                    ? "bg-amber-50/60 border border-amber-100 text-amber-900"
                    : "bg-orange-50/60 border border-orange-100 text-orange-800"
              }`}
            >
              <Icon
                icon={
                  blockerBanner.tone === "rose"
                    ? "heroicons:x-circle"
                    : "heroicons:exclamation-triangle"
                }
                className={`size-5 shrink-0 mt-0.5 ${
                  blockerBanner.tone === "rose"
                    ? "text-rose-500"
                    : blockerBanner.tone === "amber"
                      ? "text-amber-600"
                      : "text-orange-500"
                }`}
              />
              <div className="leading-relaxed flex-1">
                <p className="font-semibold">{blockerBanner.title}</p>
                <p className="mt-0.5 text-[13px] opacity-90">{blockerBanner.message}</p>
                {blockerBanner.actionHref && blockerBanner.actionLabel && (
                  <a
                    href={blockerBanner.actionHref}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      blockerBanner.tone === "rose"
                        ? "bg-rose-600 text-white hover:bg-rose-700"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    <Icon icon="heroicons:arrow-right" className="size-3.5" />
                    {blockerBanner.actionLabel}
                  </a>
                )}
              </div>
            </div>
          )}
          {loadError && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
              <Icon icon="heroicons:x-circle" className="size-5 shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
          )}
        </div>

        {/* ── RIGHT: Assignment form (Supplier picker) ── */}
        {showSupplierPicker && (
          <div className="flex flex-col gap-3 md:w-[300px] md:flex-none">
            {isEditingRequirements && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-amber-800">
                  {t(
                    "tourInstance.accommodation.requirements.editing",
                    "Đang chỉnh yêu cầu phòng",
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditingRequirements(false)}
                  className="text-xs text-stone-500 hover:text-stone-700"
                >
                  {t("common.cancel", "Huỷ")}
                </button>
              </div>
            )}
            <div>
              <Select
                label="Khách sạn / Nhà Cung Cấp (Tùy chọn)"
                value={picker.supplierId}
                onChange={(e) =>
                  setPicker((prev) => ({ ...prev, supplierId: e.target.value, roomType: "" }))
                }
                disabled={picker.isSubmitting || suppliersLoading}
                options={[
                  {
                    value: "",
                    label: suppliersLoading
                      ? "Đang tải danh sách khách sạn..."
                      : suppliers.length === 0
                        ? "Không có khách sạn phù hợp khu vực"
                        : "-- Chọn khách sạn --",
                  },
                  ...suppliers.map((s) => ({
                    value: s.id,
                    label: s.supplierCode ? `${s.name} (${s.supplierCode})` : s.name,
                  })),
                ]}
              />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Loại phòng"
                  value={picker.roomType}
                  onChange={(e) => setPicker((prev) => ({ ...prev, roomType: e.target.value }))}
                  disabled={picker.isSubmitting || (!!picker.supplierId && accommodationsLoading)}
                  options={[
                    {
                      value: "",
                      label: picker.supplierId
                        ? accommodationsLoading
                          ? "Đang tải loại phòng..."
                          : supplierAccommodations.length === 0
                            ? "Supplier chưa khai báo loại phòng — chọn loại cơ bản"
                            : "-- Chọn loại phòng --"
                        : "-- Chọn loại phòng cơ bản --",
                    },
                    ...(picker.supplierId && supplierAccommodations.length > 0
                      ? supplierAccommodations.map((a) => ({
                          value: a.roomType,
                          label: `${a.name ? `${a.name} — ${a.roomType}` : a.roomType}${
                            typeof a.totalRooms === "number" ? ` (${a.totalRooms} phòng)` : ""
                          }`,
                        }))
                      : FALLBACK_ROOM_TYPES.map((rt) => ({ value: rt, label: rt }))),
                  ]}
                />
              </div>

              <div className="w-24">
                <TextInput
                  label="Số phòng"
                  type="number"
                  min={1}
                  value={picker.quantity.toString()}
                  onChange={(e) =>
                    setPicker((prev) => ({
                      ...prev,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                  disabled={picker.isSubmitting}
                />
              </div>
            </div>

            {picker.quantity !== suggestedQuantity && (
              <p className="text-xs text-amber-700 font-medium">Đề xuất: {suggestedQuantity} phòng</p>
            )}

            <Button
              variant="primary"
              onClick={handleSaveRequirements}
              disabled={picker.isSubmitting || !picker.roomType || picker.quantity <= 0}
              className="w-full justify-center mt-2"
            >
              <Icon
                icon={picker.isSubmitting ? "heroicons:arrow-path" : "heroicons:check"}
                className={`size-4 mr-2 ${picker.isSubmitting ? "animate-spin" : ""}`}
              />
              {picker.isSubmitting ? "Đang lưu..." : "Lưu Yêu Cầu Phòng"}
            </Button>
          </div>
        )}
      </div>

      {isPublicOverview && hasSupplierAssigned && (
        <motion
          className="mx-6 mb-6 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600 lg:mx-8"
        >
          <p>
            {t(
              "tourInstance.bookingHotel.publicOverviewHint",
              "Tour public dùng chung loại phòng của tour. Quay lại trang chi tiết tour và dùng cột «Gán KS» trong bảng booking để gán số phòng — tổng không vượt quá {{limit}} phòng.",
              { limit: activity.quantity || tourRoomCap },
            )}
          </p>
        </motion>
      )}

      {/* ── BOTTOM: Per-booking list (private tour only) ── */}
      {showPerBookingAllocation && canAssign && (
        <div className="border-t border-stone-100 bg-stone-50/30">
          <div className="px-6 py-4 lg:px-8 flex items-center justify-between">
            <h5 className="text-sm font-bold text-stone-800">
              {bookings.length === 1 ? "Phân bổ phòng cho booking này" : "Phân bổ phòng cho từng booking"}
            </h5>
            <span className="text-[10px] font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
              {savedBookingIds.size}/{bookings.length} đã phân bổ
            </span>
          </div>
          <div className="divide-y divide-stone-100 border-t border-stone-100">
            {bookings.map((booking, index) => {
              const state = bookingStates[booking.id];
              if (!state) return null;
              const isSaved = savedBookingIds.has(booking.id);
              const totalRooms = sumLineRoomCount(state.lines);
              const isSaving = savingId === booking.id;
              const bookingStatus = booking.status?.toLowerCase() ?? "";
              const lockedByCheckIn =
                bookingStatus.includes("checkedin") ||
                bookingStatus.includes("checked_in") ||
                bookingStatus.includes("completed");

              return (
                <div
                  key={booking.id}
                  className={`px-6 py-5 lg:px-8 transition-colors ${
                    isSaved ? "bg-emerald-50/20" : "bg-white hover:bg-stone-50/30"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3 md:flex-1 min-w-0">
                      <span
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                          isSaved ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {isSaved ? <Icon icon="heroicons:check" className="size-4" /> : index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-stone-900 truncate">{booking.customerName}</p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {state.guestCount} khách · đề xuất {state.roomsSuggested} phòng · đã nhập {totalRooms}/{state.guestCount} phòng
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end gap-3 md:w-auto md:flex-none">
                      <div className="w-full sm:w-40">
                        <Select
                          label="Loại phòng"
                          value={state.lines[0]?.roomType ?? "Standard"}
                          onChange={(e) =>
                            state.lines[0]
                              ? updateLine(booking.id, state.lines[0].clientId, "roomType", e.target.value)
                              : undefined
                          }
                          disabled={!canAssign || lockedByCheckIn}
                          options={[
                            "Single",
                            "Double",
                            "Twin",
                            "Triple",
                            "Quad",
                            "Family",
                            "Suite",
                            "Dormitory",
                            "Villa",
                            "Standard",
                            "Deluxe",
                            "VIP",
                            "Other",
                          ].map((rt) => ({ value: rt, label: rt }))}
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <TextInput
                          label="Số phòng"
                          type="number"
                          min={1}
                          value={(state.lines[0]?.roomCount ?? 1).toString()}
                          max={state.guestCount}
                          onChange={(e) => {
                            if (!state.lines[0]) return;
                            const other = sumLineRoomCount(state.lines.slice(1));
                            const maxForLine = Math.max(1, state.guestCount - other);
                            updateLine(
                              booking.id,
                              state.lines[0].clientId,
                              "roomCount",
                              Math.min(maxForLine, Math.max(1, Number(e.target.value) || 1)),
                            );
                          }}
                          disabled={!canAssign || lockedByCheckIn}
                        />
                      </div>
                      
                      <Button
                        variant="primary"
                        onClick={() => handleSave(booking.id)}
                        disabled={!canAssign || lockedByCheckIn || isSaving}
                        className={`w-full sm:w-32 justify-center h-10 ${
                          isSaved
                            ? "!bg-stone-100 !text-stone-600 hover:!bg-stone-200 !border-transparent !shadow-none"
                            : ""
                        }`}
                      >
                        <Icon
                          icon={
                            isSaving
                              ? "heroicons:arrow-path"
                              : isSaved
                              ? "heroicons:check-circle"
                              : "heroicons:check"
                          }
                          className={`size-4 mr-2 ${isSaving ? "animate-spin" : ""}`}
                        />
                        {lockedByCheckIn
                          ? t("tourInstance.bookingHotel.locked", "Đã khóa")
                          : isSaving
                            ? t("common.saving", "Đang lưu...")
                            : isSaved
                              ? t("common.update", "Cập nhật")
                              : t("common.save", "Lưu")}
                      </Button>
                    </div>
                  </div>
                  {totalRooms > state.guestCount && (
                    <div className="mt-2 pl-11">
                      <p className="text-xs font-medium text-rose-600">
                        {t("tourInstance.bookingHotel.validation.roomCountTooHighTotal", {
                          defaultValue:
                            "Tổng số phòng ({{roomCount}}) không được vượt quá số khách ({{guestCount}}).",
                          roomCount: totalRooms,
                          guestCount: state.guestCount,
                        })}
                      </p>
                    </div>
                  )}
                  {state.lines.length < ROOM_TYPE_SELECT_OPTIONS.length
                    && totalRooms < state.guestCount
                    && !lockedByCheckIn && (
                    <div className="mt-2 pl-11">
                      <button
                        type="button"
                        onClick={() => addRoomLine(booking.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800"
                      >
                        <Icon icon="heroicons:plus-circle" className="size-4" />
                        {t("tourInstance.bookingHotel.addRoomType", "Thêm loại phòng")}
                      </button>
                    </div>
                  )}
                  {state.lines.length > 1 && (
                    <div className="mt-3 pl-11 space-y-3 border-t border-stone-100 pt-3">
                      {state.lines.slice(1).map((line) => {
                        const otherRooms = sumLineRoomCount(
                          state.lines.filter((l) => l.clientId !== line.clientId),
                        );
                        const maxForLine = Math.max(1, state.guestCount - otherRooms);
                        return (
                          <div
                            key={line.clientId}
                            className="flex flex-col sm:flex-row sm:items-end gap-3"
                          >
                            <div className="w-full sm:w-40">
                              <Select
                                label={t("tourInstance.accommodation.roomType", "Loại phòng")}
                                value={line.roomType}
                                onChange={(e) =>
                                  updateLine(booking.id, line.clientId, "roomType", e.target.value)
                                }
                                disabled={!canAssign || lockedByCheckIn}
                                options={ROOM_TYPE_SELECT_OPTIONS.map((rt) => ({
                                  value: rt,
                                  label: rt,
                                }))}
                              />
                            </div>
                            <div className="w-full sm:w-24">
                              <TextInput
                                label={t("tourInstance.accommodation.quantity", "Số phòng")}
                                type="number"
                                min={1}
                                max={maxForLine}
                                value={line.roomCount.toString()}
                                onChange={(e) =>
                                  updateLine(
                                    booking.id,
                                    line.clientId,
                                    "roomCount",
                                    Math.min(
                                      maxForLine,
                                      Math.max(1, Number(e.target.value) || 1),
                                    ),
                                  )
                                }
                                disabled={!canAssign || lockedByCheckIn}
                              />
                            </div>
                            {!lockedByCheckIn && (
                              <button
                                type="button"
                                onClick={() => removeRoomLine(booking.id, line.clientId)}
                                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-500 hover:bg-stone-100 h-10"
                              >
                                <Icon icon="heroicons:trash" className="size-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allSaved && bookings.length > 0 && (
        <div className="flex items-center gap-2 px-6 py-4 bg-emerald-50 border-t border-emerald-100 lg:px-8">
          <Icon icon="heroicons:check-badge" className="size-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700">
            Đã hoàn tất phân bổ! {bookings.length} booking đã có phòng
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type TabType = "accommodation" | "external-transport";

export default function PublicTourBookingAssignmentPanel({
  instanceId,
  instanceType,
  bookings,
  bookingsLoading,
  accommodationActivities,
  externalTransportActivities,
  continent,
  onSaveTicket,
  onConfirmExternalTransport,
  onSaveRoomAssignment,
  onLoadRoomAssignments,
  onRoomAssignmentSaved,
  onSetAccommodationRequirements,
  onRequirementsSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(
    accommodationActivities.length > 0 ? "accommodation" : "external-transport",
  );

  const isPublic = instanceType?.toLowerCase() === "public";
  const isPrivate = instanceType?.toLowerCase() === "private";
  if (!isPublic && !isPrivate) return null;
  if (accommodationActivities.length === 0 && externalTransportActivities.length === 0) return null;

  const hasAccom = accommodationActivities.length > 0;
  const hasExternal = externalTransportActivities.length > 0;

  return (
    <section className="rounded-[1.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden mt-8">
      <div className="px-6 py-5 border-b border-stone-100 bg-[#F8F8F6]">
        <div className="flex items-center gap-3">
          <Icon icon="heroicons:clipboard-document-list" className="size-6 text-stone-600" />
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Phân bổ Dịch Vụ / Vé
          </h2>
        </div>
        <p className="mt-2 text-sm text-stone-500 max-w-[65ch]">
          {isPublic 
            ? "Tour public có nhiều order độc lập — phòng khách sạn và vé phương tiện phải gán riêng cho từng booking."
            : "Phân bổ phòng khách sạn và vé phương tiện tương ứng cho khách hàng trong tour riêng tư."}
          {" (Xe đi chung không hiển thị ở đây vì đã gán chung ở trên)."}
        </p>
      </div>

      {hasAccom && hasExternal && (
        <div className="flex border-b border-stone-100 px-2">
          <button
            onClick={() => setActiveTab("accommodation")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "accommodation"
                ? "border-orange-500 text-orange-600 bg-orange-50/50"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Icon icon="heroicons:building-office-2" className="size-4.5" />
            Phòng khách sạn
            <span
              className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${
                activeTab === "accommodation" ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"
              }`}
            >
              {accommodationActivities.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("external-transport")}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "external-transport"
                ? "border-blue-500 text-blue-700 bg-blue-50/50"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Icon icon="heroicons:ticket" className="size-4.5" />
            Vé phương tiện
            <span
              className={`rounded-full text-[11px] font-bold px-2 py-0.5 ml-1 ${
                activeTab === "external-transport" ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-600"
              }`}
            >
              {externalTransportActivities.length}
            </span>
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 bg-stone-50/30">
        {bookingsLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center text-stone-400 text-sm">
            <Icon icon="heroicons:arrow-path" className="size-5 animate-spin" />
            Đang tải danh sách booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-sm">
            <Icon icon="heroicons:users" className="mx-auto mb-2 size-8 opacity-40" />
            <p>Chưa có booking nào cho tour instance này.</p>
          </div>
        ) : (
          <>
            {(!hasExternal || activeTab === "accommodation") && hasAccom && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-[1.5rem] bg-orange-50/80 border border-orange-200/60 p-5 shadow-sm text-sm text-orange-800">
                  <Icon icon="heroicons:information-circle" className="size-5 shrink-0 mt-0.5 text-orange-500" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1 text-base tracking-tight">
                      {bookings.length === 1 ? "Phân bổ phòng cho booking này" : "Phân bổ phòng cho từng booking"}
                    </p>
                    <p className="max-w-[75ch] text-orange-700">
                      Khách sạn được thiết lập ở cấp độ tour. Tại đây, bạn phân bổ
                      <strong> số phòng cụ thể</strong> cho {bookings.length === 1 ? "khách của booking này" : "từng booking"} dựa trên tổng số phòng đã block cho cả đoàn.
                    </p>
                  </div>
                </div>

                {accommodationActivities.map((activity) => (
                  <AccommodationBookingCard
                    key={activity.activityId}
                    activity={activity}
                    instanceId={instanceId}
                    bookings={bookings}
                    continent={continent}
                    onSaveRoomAssignment={onSaveRoomAssignment}
                    onLoadRoomAssignments={onLoadRoomAssignments}
                    onRoomAssignmentSaved={onRoomAssignmentSaved}
                    onSetAccommodationRequirements={onSetAccommodationRequirements}
                    onRequirementsSaved={onRequirementsSaved}
                  />
                ))}
              </div>
            )}

            {(!hasAccom || activeTab === "external-transport") && hasExternal && (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-[1.5rem] bg-blue-50/80 border border-blue-200/60 p-5 shadow-sm text-sm text-blue-800">
                  <Icon icon="heroicons:information-circle" className="size-5 shrink-0 mt-0.5 text-blue-500" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1 text-base tracking-tight">Gán vé phương tiện per-booking</p>
                    <p className="max-w-[65ch] text-blue-700">
                      Mỗi booking cần vé riêng. Nhập đủ thông tin chuyến bay / tàu / thuyền cho từng khách.
                      (Xe di chuyển đi chung không xuất hiện ở đây).
                    </p>
                  </div>
                </div>

                {externalTransportActivities.map((activity) => (
                  <div key={activity.activityId} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon={
                            activity.transportType === "Flight"
                              ? "heroicons:paper-airplane"
                              : activity.transportType === "Train"
                              ? "heroicons:arrow-right"
                              : "heroicons:globe-alt"
                          }
                          className="size-4 text-blue-600 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-stone-800">{activity.title}</p>
                          <p className="text-xs text-stone-500">Ngày {activity.dayNumber}</p>
                        </div>
                      </div>
                      {activity.confirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
                          <Icon icon="heroicons:check-circle" className="size-3" />
                          Đã xác nhận
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <ExternalTicketAssignmentPanel
                        activityId={activity.activityId}
                        activityTitle={activity.title}
                        transportType={activity.transportType}
                        bookings={bookings}
                        activityDate={activity.date}
                        instanceId={instanceId}
                        initialConfirmed={activity.confirmed}
                        onSave={(entry) => onSaveTicket?.(activity.activityId, entry)}
                        onConfirmAll={(dep, arr) => onConfirmExternalTransport?.(activity.activityId, dep, arr)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
