import { z } from "zod";

const activityRouteSchema = z.object({
  id: z.string(),
  fromLocationIndex: z.string(),
  fromLocationCustom: z.string().min(1, "Điểm khởi hành không được để trống"),
  enFromLocationCustom: z.string(),
  toLocationIndex: z.string(),
  toLocationCustom: z.string().min(1, "Điểm đến không được để trống"),
  enToLocationCustom: z.string(),
  transportationType: z.string(),
  enTransportationType: z.string(),
  transportationName: z.string(),
  enTransportationName: z.string(),
  durationMinutes: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Thời gian không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  price: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  note: z.string(),
  enNote: z.string(),
});

// Base activity schema fields (no activityType — used for discriminated union variants)
const baseActivityFields = {
  id: z.string().optional(),
  title: z
    .string()
    .min(1, "Tên hoạt động không được để trống")
    .max(200, "Tên hoạt động không được vượt quá 200 ký tự"),
  enTitle: z
    .string()
    .max(200, "Tên hoạt động (EN) không được vượt quá 200 ký tự")
    .optional(),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional(),
  enDescription: z
    .string()
    .max(1000, "Mô tả (EN) không được vượt quá 1000 ký tự")
    .optional(),
  note: z.string().optional(),
  enNote: z.string().optional(),
  estimatedCost: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Chi phí ước tính không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  isOptional: z.boolean().default(false),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  linkToResources: z
    .array(
      z
        .string()
        .refine(
          (val) => !val || /^https?:\/\/.{1,2048}$/.test(val),
          "Đường dẫn tài nguyên không hợp lệ",
        ),
    )
    .optional()
    .default([]),
  routes: z.array(activityRouteSchema).optional().default([]),
  // Location fields — all activity types
  locationName: z.string().optional(),
  enLocationName: z.string().optional(),
  locationCity: z.string().optional(),
  enLocationCity: z.string().optional(),
  locationCountry: z.string().optional(),
  enLocationCountry: z.string().optional(),
  locationAddress: z.string().optional(),
  enLocationAddress: z.string().optional(),
  locationEntranceFee: z.string().optional(),
};

// Base activity schema — all non-7/non-8 activity types
const baseActivitySchema = z.object({
  ...baseActivityFields,
  activityType: z
    .union([
      z.literal("0"),
      z.literal("1"),
      z.literal("2"),
      z.literal("3"),
      z.literal("4"),
      z.literal("5"),
      z.literal("6"),
    ])
    .optional()
    .default("0"),
});

// Type 7 (Transport) variant — requires from/to location
const transportActivitySchema = baseActivitySchema.extend({
  fromLocation: z.string().optional(),
  enFromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  enToLocation: z.string().optional(),
  transportationType: z.string().min(1, "Loại phương tiện là bắt buộc"),
  enTransportationType: z.string().optional(),
  transportationName: z.string().max(300, "Tên phương tiện không được vượt quá 300 ký tự").optional(),
  enTransportationName: z.string().optional(),
  durationMinutes: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Thời gian không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  price: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  // Accommodation fields should be empty strings for type 7
  accommodationName: z.string().optional().default(""),
  enAccommodationName: z.string().optional().default(""),
  accommodationAddress: z.string().optional().default(""),
  enAccommodationAddress: z.string().optional().default(""),
  accommodationPhone: z.string().optional().default(""),
  checkInTime: z.string().optional().default(""),
  checkOutTime: z.string().optional().default(""),
  roomType: z.string().optional().default(""),
  roomCapacity: z.string().optional().default(""),
  mealsIncluded: z.string().optional().default(""),
  roomPrice: z.string().optional().default(""),
  numberOfRooms: z.string().optional().default(""),
  numberOfNights: z.string().optional().default(""),
  specialRequest: z.string().optional().default(""),
  latitude: z.string().optional().default(""),
  longitude: z.string().optional().default(""),
});

// Type 8 (Accommodation) variant — requires accommodationName
const accommodationActivitySchema = baseActivitySchema.extend({
  fromLocation: z.string().optional().default(""),
  enFromLocation: z.string().optional().default(""),
  toLocation: z.string().optional().default(""),
  enToLocation: z.string().optional().default(""),
  transportationType: z.string().optional().default("0"),
  enTransportationType: z.string().optional().default(""),
  transportationName: z.string().optional().default(""),
  enTransportationName: z.string().optional().default(""),
  durationMinutes: z.string().optional().default(""),
  price: z.string().optional().default(""),
  // Accommodation fields required for type 8
  accommodationName: z
    .string()
    .min(1, "Tên chỗ nghỉ không được để trống")
    .max(200, "Tên chỗ nghỉ không được vượt quá 200 ký tự"),
  enAccommodationName: z.string().optional(),
  accommodationAddress: z
    .string()
    .max(500, "Địa chỉ không được vượt quá 500 ký tự")
    .optional(),
  enAccommodationAddress: z.string().optional(),
  accommodationPhone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, "Số điện thoại không hợp lệ")
    .optional(),
  checkInTime: z.string().max(50).optional(),
  checkOutTime: z.string().max(50).optional(),
  roomType: z.string().max(50).optional(),
  roomCapacity: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().int().positive("Sức chứa phòng phải lớn hơn 0"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  mealsIncluded: z.string().max(100).optional(),
  roomPrice: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá phòng không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  numberOfRooms: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().int().min(1).max(999, "Số phòng phải từ 1 đến 999"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  numberOfNights: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().int().min(1).max(999, "Số đêm phải từ 1 đến 999"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  specialRequest: z.string().max(1000).optional(),
  latitude: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(
      z
        .number()
        .min(-90, "Vĩ độ phải nằm trong khoảng -90 đến 90")
        .max(90, "Vĩ độ phải nằm trong khoảng -90 đến 90"),
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  longitude: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(
      z
        .number()
        .min(-180, "Kinh độ phải nằm trong khoảng -180 đến 180")
        .max(180, "Kinh độ phải nằm trong khoảng -180 đến 180"),
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
});

export const activitySchema = z.discriminatedUnion("activityType", [
  z
    .object({ activityType: z.literal("7") })
    .merge(transportActivitySchema.omit({ activityType: true })),
  z
    .object({ activityType: z.literal("8") })
    .merge(accommodationActivitySchema.omit({ activityType: true })),
  baseActivitySchema,
]);

export type ActivityFormValues = z.infer<typeof activitySchema>;
