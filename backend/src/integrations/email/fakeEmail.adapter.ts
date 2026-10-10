import type {
    EmailPort,
} from '../../modules/notifications/email.port.js';

export class FakeEmailAdapter
    implements EmailPort {
    async send(
        email: string,
        message: string,
    ): Promise<void> {
        console.log(`[EMAIL SIMULÉ] À ${email}`);
        console.log(message);
    }
}