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

// Type 7 (Transport) variant — itinerary-only (generic transport mode, no supplier identity)
const transportActivitySchema = baseActivitySchema.extend({
  fromLocation: z.string().optional(),
  enFromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  enToLocation: z.string().optional(),
  transportationType: z.string().min(1, "Loại phương tiện là bắt buộc"),
  enTransportationType: z.string().optional(),
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

});

// Type 8 (Accommodation) variant — itinerary-only (no supplier-specific fields)
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
});

export const activitySchema = z.union([
  z
    .object({ activityType: z.literal("7") })
    .merge(transportActivitySchema.omit({ activityType: true })),
  z
    .object({ activityType: z.literal("8") })
    .merge(accommodationActivitySchema.omit({ activityType: true })),
  baseActivitySchema,
]);

export type ActivityFormValues = z.infer<typeof activitySchema>;
