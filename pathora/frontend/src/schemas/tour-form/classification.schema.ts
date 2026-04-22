import { z } from "zod";

export const classificationSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Tên gói không được để trống")
    .max(200, "Tên gói không được vượt quá 200 ký tự"),
  enName: z
    .string()
    .max(200, "Tên gói (EN) không được vượt quá 200 ký tự")
    .optional(),
  description: z
    .string()
    .max(1000, "Mô tả không được vượt quá 1000 ký tự")
    .optional(),
  enDescription: z
    .string()
    .max(1000, "Mô tả (EN) không được vượt quá 1000 ký tự")
    .optional(),
  basePrice: z
    .string()
    .min(1, "Giá không được âm")
    .transform((v) => Number(v))
    .pipe(z.number().positive("Giá phải lớn hơn 0"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any),
  durationDays: z
    .string()
    .min(1, "Số ngày không hợp lệ"),
});

export type ClassificationFormValues = z.infer<typeof classificationSchema>;
