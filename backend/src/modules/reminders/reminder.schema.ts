import {
    z,
} from 'zod';

export const createReminderSchema =
    z.object({
        catalogItemId: z.number().int().positive().optional(),
        message:
            z.string()
                .trim()
                .min(1)
                .max(500),

        scheduledAt:
            z.string()
                .datetime()
                .optional(),
    });