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
  activities: z.array(activitySchema).optional().default([]).superRefine((activities, ctx) => {
    let previousEndTime: string | undefined;

    activities.forEach((activity, index) => {
      if (activity.startTime && activity.endTime) {
        if (activity.endTime < activity.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Thời gian kết thúc không được trước thời gian bắt đầu",
            path: [index, "endTime"],
          });
        }
      }

      if (index > 0 && activity.startTime && previousEndTime) {
        if (activity.startTime < previousEndTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Thời gian bắt đầu không được trước thời gian kết thúc của hoạt động trước",
            path: [index, "startTime"],
          });
        }
      }

      if (activity.endTime) {
        previousEndTime = activity.endTime;
      } else if (activity.startTime) {
        previousEndTime = activity.startTime;
      }
    });
  }),
});

export type DayPlanFormValues = z.infer<typeof dayPlanSchema>;
