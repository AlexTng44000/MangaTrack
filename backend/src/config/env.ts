import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url(),

    JWT_SECRET: z
        .string()
        .min(32),

    JWT_EXPIRES_IN: z
        .string()
        .default('1h'),
});

const result =
    envSchema.safeParse(process.env);

if (!result.success) {
    console.error(
        'Variables d’environnement invalides',
        result.error.flatten(),
    );

    process.exit(1);
}

export const env = result.data;