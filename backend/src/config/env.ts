import 'dotenv/config';

import {
    z,
} from 'zod';

const envSchema = z.object({
    DATABASE_URL: z
        .string()
        .url(),

    REDIS_URL: z
        .string()
        .url()
        .default(
            'redis://localhost:6379',
        ),

    JWT_SECRET: z
        .string()
        .min(32),

    JWT_EXPIRES_IN: z
        .string()
        .default('1h'),

    ANILIST_API_URL: z
        .string()
        .url()
        .default(
            'https://graphql.anilist.co',
        ),

    SMTP_HOST: z
        .string()
        .min(1)
        .default(
            'smtp-relay.brevo.com',
        ),

    SMTP_PORT: z
        .coerce
        .number()
        .int()
        .positive()
        .default(587),

    SMTP_USER: z
        .string()
        .min(1),

    SMTP_PASSWORD: z
        .string()
        .min(1),

    MAIL_FROM_NAME: z
        .string()
        .min(1)
        .default(
            'MangaTrack',
        ),

    MAIL_FROM_EMAIL: z
        .string()
        .email(),
});

const result =
    envSchema.safeParse(
        process.env,
    );

if (!result.success) {
    console.error(
        'Variables d’environnement invalides',
        result.error.flatten(),
    );

    process.exit(1);
}

export const env = result.data;