import {
    z,
} from 'zod';

export const createReminderSchema =
    z.object({
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