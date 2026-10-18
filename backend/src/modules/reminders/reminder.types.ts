export type ReminderStatus =
    | 'pending'
    | 'sent'
    | 'failed'
    | 'cancelled';

export interface Reminder {
    id: number;
    userId: number;
    message: string;
    scheduledAt: string | null;
    status: ReminderStatus;
    createdAt: string;
    jobId: string | null;
}

export interface CreateReminderInput {
    message: string;
    scheduledAt?: string;
}