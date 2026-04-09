import { z } from "zod";

export const serviceSchema = z.object({
  serviceName: z
    .string()
    .min(1, "Tên dịch vụ không được để trống")
    .max(200, "Tên dịch vụ không được vượt quá 200 ký tự"),
  enServiceName: z
    .string()
    .max(200, "Tên dịch vụ (EN) không được vượt quá 200 ký tự")
    .optional(),
  pricingType: z.string().optional(),
  price: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  salePrice: z
    .string()
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().nonnegative("Giá khuyến mãi không được âm"))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .catch(() => "" as any)
    .optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  contactNumber: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, "Số điện thoại không hợp lệ")
    .optional(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
