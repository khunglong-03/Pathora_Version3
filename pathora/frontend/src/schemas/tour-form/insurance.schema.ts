import { z } from "zod";

export const insuranceSchema = z.object({
  insuranceName: z
    .string()
    .min(1, "Tên bảo hiểm không được để trống")
    .max(200, "Tên bảo hiểm không được vượt quá 200 ký tự"),
  enInsuranceName: z
    .string()
    .max(200, "Tên bảo hiểm (EN) không được vượt quá 200 ký tự")
    .optional(),
  insuranceType: z.string().min(1, "Loại bảo hiểm là bắt buộc"),
  insuranceProvider: z
    .string()
    .max(200, "Nhà cung cấp không được vượt quá 200 ký tự")
    .optional(),
  coverageDescription: z
    .string()
    .max(1000, "Mô tả bảo hiểm không được vượt quá 1000 ký tự")
    .optional(),
  enCoverageDescription: z
    .string()
    .max(1000, "Mô tả bảo hiểm (EN) không được vượt quá 1000 ký tự")
    .optional(),
  coverageAmount: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Số tiền bảo hiểm không được âm"))
    .or(z.string())
    .optional(),
  coverageFee: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Phí bảo hiểm không được âm"))
    .or(z.string())
    .optional(),
  isOptional: z.boolean().default(false),
  note: z.string().optional(),
  enNote: z.string().optional(),
});

export type InsuranceFormValues = z.infer<typeof insuranceSchema>;
