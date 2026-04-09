import { z } from "zod";
import { activitySchema } from "./activity.schema";

export const dayPlanSchema = z.object({
  id: z.string().optional(),
  dayNumber: z
    .string()
    .min(1, "Số ngày không hợp lệ"),
  title: z
    .string()
    .min(1, "Tiêu đề ngày không được để trống")
    .max(200, "Tiêu đề ngày không được vượt quá 200 ký tự"),
  enTitle: z
    .string()
    .max(200, "Tiêu đề ngày (EN) không được vượt quá 200 ký tự")
    .optional(),
  description: z
    .string()
    .max(2000, "Mô tả không được vượt quá 2000 ký tự")
    .optional(),
  enDescription: z
    .string()
    .max(2000, "Mô tả (EN) không được vượt quá 2000 ký tự")
    .optional(),
  activities: z.array(activitySchema).optional().default([]),
});

export type DayPlanFormValues = z.infer<typeof dayPlanSchema>;
