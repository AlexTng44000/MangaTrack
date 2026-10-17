import { z } from 'zod';

export const createNotificationSchema =
    z.object({
        userId: z
            .number()
            .int()
            .positive(),

        email: z
            .string()
            .email(),

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