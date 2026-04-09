import { z } from "zod";

export const translationFieldsSchema = z.object({
  tourName: z.string().max(500, "Tên tour không được vượt quá 500 ký tự").optional(),
  shortDescription: z.string().max(250, "Mô tả ngắn không được vượt quá 250 ký tự").optional(),
  longDescription: z.string().max(5000, "Mô tả chi tiết không được vượt quá 5000 ký tự").optional(),
  seoTitle: z.string().max(70, "SEO title không được vượt quá 70 ký tự").optional(),
  seoDescription: z.string().max(320, "SEO description không được vượt quá 320 ký tự").optional(),
});

export type TranslationFieldsValues = z.infer<typeof translationFieldsSchema>;
