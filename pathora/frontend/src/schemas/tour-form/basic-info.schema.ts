import { z } from "zod";

export const basicInfoSchema = z.object({
  tourName: z
    .string()
    .trim()
    .min(1, "Tên tour không được để trống")
    .max(500, "Tên tour không được vượt quá 500 ký tự"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Mô tả ngắn không được để trống")
    .max(250, "Mô tả ngắn không được vượt quá 250 ký tự"),
  longDescription: z
    .string()
    .trim()
    .min(1, "Mô tả chi tiết không được để trống")
    .max(5000, "Mô tả chi tiết không được vượt quá 5000 ký tự"),
  seoTitle: z
    .string()
    .max(70, "SEO title không được vượt quá 70 ký tự")
    .optional(),
  seoDescription: z
    .string()
    .max(320, "SEO description không được vượt quá 320 ký tự")
    .optional(),
  status: z.string().min(1, "Status là bắt buộc"),
  tourScope: z.string().optional(),
  continent: z.string().optional(),
  customerSegment: z.string().optional(),
});

export type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
