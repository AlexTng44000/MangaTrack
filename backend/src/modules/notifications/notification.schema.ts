import { z } from 'zod';

export const createNotificationSchema =
    z.object({
        message: z
            .string()
            .trim()
            .min(1)
            .max(500),

        scheduledAt: z
            .string()
            .refine(
                (value) =>
                    !Number.isNaN(
                        Date.parse(value),
                    ),
                {
                    message:
                        'scheduledAt doit être une date valide',
                },
            )
            .optional(),
    });