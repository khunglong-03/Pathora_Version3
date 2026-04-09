// Re-export all section schemas and types
export { basicInfoSchema, type BasicInfoFormValues } from "./basic-info.schema";
export { translationFieldsSchema, type TranslationFieldsValues } from "./translation.schema";
export { dayPlanSchema, type DayPlanFormValues } from "./day-plan.schema";
export { classificationSchema, type ClassificationFormValues } from "./classification.schema";
export { activitySchema, type ActivityFormValues } from "./activity.schema";
export { serviceSchema, type ServiceFormValues } from "./service.schema";
export { insuranceSchema, type InsuranceFormValues } from "./insurance.schema";

// Combined schema — used as a safety-net validation layer in tourCreatePayload.ts
import { z } from "zod";
import { basicInfoSchema } from "./basic-info.schema";
import { translationFieldsSchema } from "./translation.schema";
import { serviceSchema } from "./service.schema";
import { activitySchema } from "./activity.schema";

// Flat schema structures matching the current form state (dayPlans separate from classifications)
const dayPlanSchemaForCombo = z.object({
  id: z.string().optional(),
  dayNumber: z.string(),
  title: z.string(),
  enTitle: z.string().optional(),
  description: z.string().optional(),
  enDescription: z.string().optional(),
  activities: z.array(activitySchema).optional().default([]),
});

const classificationSchemaForCombo = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên gói không được để trống").max(200),
  enName: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  enDescription: z.string().max(1000).optional(),
  basePrice: z
    .string()
    .min(1, "Giá không được để trống")
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá không được âm"))
    .or(z.string()),
  durationDays: z
    .string()
    .min(1, "Số ngày không hợp lệ")
    .transform((v) => Number(v))
    .pipe(z.number().int().positive("Số ngày phải là số nguyên dương"))
    .or(z.string()),
});

const insuranceSchemaForCombo = z.object({
  insuranceName: z.string().min(1, "Tên bảo hiểm không được để trống").max(200),
  enInsuranceName: z.string().max(200).optional(),
  insuranceType: z.string().min(1, "Loại bảo hiểm là bắt buộc"),
  insuranceProvider: z.string().max(200).optional(),
  coverageDescription: z.string().max(1000).optional(),
  enCoverageDescription: z.string().max(1000).optional(),
  coverageAmount: z.string().optional(),
  coverageFee: z.string().optional(),
  isOptional: z.boolean().default(false),
  note: z.string().optional(),
  enNote: z.string().optional(),
});

// Complete form schema matching TourForm state structure
// dayPlans: DayPlanForm[][] (flat array of arrays per classification)
// insurances: InsuranceForm[][] (flat array of arrays per classification)
// classifications: ClassificationForm[] (flat array)
export const tourFormSchema = z.object({
  basicInfo: basicInfoSchema,
  enTranslation: translationFieldsSchema,
  classifications: z
    .array(classificationSchemaForCombo)
    .min(1, "Cần ít nhất một gói tour"),
  dayPlans: z.array(z.array(dayPlanSchemaForCombo)).optional().default([]),
  insurances: z.array(z.array(insuranceSchemaForCombo)).optional().default([]),
  services: z.array(serviceSchema).optional().default([]),
  // UI state that travels with form
  activeLang: z.enum(["vi", "en"]).default("vi"),
  deletedClassificationIds: z.array(z.string()).optional().default([]),
  deletedActivityIds: z.array(z.string()).optional().default([]),
});

export type TourFormValues = z.infer<typeof tourFormSchema>;

// ── Per-step schema array for step-level validation ──────────────────────────
// Each entry validates only the fields relevant to that wizard step.
// Order matches WIZARD_STEPS: [basic, packages, itineraries, services, insurance, preview]
export const stepSchemas = [
  basicInfoSchema,
  z.array(classificationSchemaForCombo).min(1, "Cần ít nhất một gói tour"),
  z.array(z.array(dayPlanSchemaForCombo)),
  z.array(serviceSchema),
  z.array(z.array(insuranceSchemaForCombo)),
  z.any(), // preview step — no validation
] as const;
