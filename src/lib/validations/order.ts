import { z } from 'zod';

export const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format'),
  items: z
    .number()
    .int('Items must be a whole number')
    .positive('Items must be greater than 0')
    .max(1000, 'Maximum 1000 items per order'),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export const validateOrder = (data: unknown) => {
  return orderSchema.safeParse(data);
};
