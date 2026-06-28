import { z } from "zod";

// ---- Auth Validators ----
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  orgName: z.string().min(2, "Organization name required").max(200),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---- Tool Execution Validators ----
export const executeToolSchema = z.object({
  toolSlug: z.string().min(1),
  input: z.record(z.unknown()),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

// ---- Credit Purchase Validators ----
export const purchaseCreditsSchema = z.object({
  amount: z.enum(["100", "500", "1000"]),
  provider: z.enum(["stripe", "razorpay"]),
});

// ---- Admin Validators ----
export const adjustCreditsSchema = z.object({
  orgId: z.string().uuid(),
  amount: z.number().int(), // Positive or negative
  reason: z.string().min(1, "Reason is required"),
});

export const manualPaymentSchema = z.object({
  orgId: z.string().uuid(),
  amount: z.number().positive(),
  credits: z.number().int().positive(),
  method: z.enum(["bank_transfer", "upi", "cash", "cheque", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ---- Invoice Validators ----
export const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      rate: z.number().positive(),
    })
  ),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  currency: z.string().length(3).optional().default("USD"),
  tax: z.number().min(0).optional().default(0),
});

// ---- Pagination Validators ----
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// ---- API Key Validators ----
export const createApiKeySchema = z.object({
  name: z.string().min(1, "Key name is required").max(100),
  permissions: z.array(z.string()).min(1, "At least one permission required"),
  expiresAt: z.string().datetime().optional(),
});
