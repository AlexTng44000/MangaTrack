export interface CreateNotificationInput {
    userId: number;
    email: string;
    message: string;
    scheduledAt?: string;
}