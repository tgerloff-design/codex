import { z } from 'zod';
import { config } from '../config';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const workloadRequestSchema = z.object({
  mode: z.enum(['ssrs', 'db']),
  resourceIds: z.array(z.string()).default([]),
  startDate: dateSchema,
  endDate: dateSchema
}).superRefine((value, ctx) => {
  const start = new Date(`${value.startDate}T00:00:00Z`);
  const end = new Date(`${value.endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid date input'
    });
    return;
  }

  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'endDate must be greater than or equal to startDate'
    });
  }

  const dayRange = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  if (dayRange > config.maxDateRangeDays) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Date range cannot exceed ${config.maxDateRangeDays} days`
    });
  }
});

export type ValidatedWorkloadRequest = z.infer<typeof workloadRequestSchema>;