import {
    createTransport,
} from 'nodemailer';

import type {
    Transporter,
} from 'nodemailer';

import type {
    EmailPort,
} from '../../modules/notifications/email.port.js';

interface BrevoEmailAdapterConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    fromName: string;
    fromEmail: string;
}

export class BrevoEmailAdapter
    implements EmailPort {

    private readonly transporter:
        Transporter;

    constructor(
        private readonly config:
            BrevoEmailAdapterConfig,
    ) {
        this.transporter =
            createTransport({
                host:
                    this.config.host,

                port:
                    this.config.port,

                secure:
                    this.config.port ===
                    465,

                auth: {
                    user:
                        this.config.user,

                    pass:
                        this.config.password,
                },
            });
    }

    async send(
        email: string,
        message: string,
    ): Promise<void> {
        await this.transporter.sendMail({
            from: {
                name:
                    this.config.fromName,

                address:
                    this.config.fromEmail,
            },

            to:
                email,

            subject:
                'Rappel MangaTrack',

            text:
                message,
        });
    }
}
