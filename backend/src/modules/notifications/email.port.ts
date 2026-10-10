export interface EmailPort {
    send(
        email: string,
        message: string,
    ): Promise<void>;
}