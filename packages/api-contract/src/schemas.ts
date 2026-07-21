import { z } from "zod";

export const IsoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const MerQuerySchema = z.object({
  from: IsoDateString,
  to: IsoDateString,
  includeAllocation: z.coerce.boolean().optional().default(true),
});

export const ChannelMerSchema = z.object({
  name: z.string(),
  spend: z.number().nonnegative(),
  salesContribution: z.number().nonnegative().optional(),
  effectiveMer: z.number().nullable().optional(),
  spendShare: z.number().min(0).max(1).optional(),
});

export const AllocationActionSchema = z.object({
  type: z.enum(["cut", "shift", "hold", "watch"]),
  channel: z.string(),
  percentChange: z.number().optional(),
  detail: z.string(),
});

export const AllocationSuggestionSchema = z.object({
  suggestedTestDays: z.number().int().positive(),
  why: z.string(),
  actions: z.array(AllocationActionSchema),
  isAboveBreakEven: z.boolean().nullable(),
});

export const MerResponseSchema = z.object({
  from: IsoDateString,
  to: IsoDateString,
  sales: z.number().nonnegative(),
  spend: z.number().nonnegative(),
  mer: z.number().nullable(),
  breakEvenMer: z.number().positive(),
  channels: z.array(ChannelMerSchema),
  allocation: AllocationSuggestionSchema.optional(),
});

export const ManualSpendEntrySchema = z.object({
  date: IsoDateString,
  channel: z.string().min(1),
  amount: z.number().nonnegative(),
  currency: z.string().length(3).default("USD"),
});

export const PostSpendBodySchema = z.object({
  entries: z.array(ManualSpendEntrySchema).min(1),
});

export const PostSpendResponseSchema = z.object({
  accepted: z.number().int().nonnegative(),
  shopId: z.string(),
});

export const AllocationQuerySchema = z.object({
  from: IsoDateString,
  to: IsoDateString,
});

export const AllocationResponseSchema = z.object({
  from: IsoDateString,
  to: IsoDateString,
  breakEvenMer: z.number().positive(),
  overallMer: z.number().nullable(),
  allocation: AllocationSuggestionSchema,
  channels: z.array(ChannelMerSchema),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type MerQuery = z.infer<typeof MerQuerySchema>;
export type MerResponse = z.infer<typeof MerResponseSchema>;
export type PostSpendBody = z.infer<typeof PostSpendBodySchema>;
export type PostSpendResponse = z.infer<typeof PostSpendResponseSchema>;
export type AllocationQuery = z.infer<typeof AllocationQuerySchema>;
export type AllocationResponse = z.infer<typeof AllocationResponseSchema>;
