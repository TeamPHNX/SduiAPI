export class SduiAuthError extends Error {
    public readonly context: Record<string, unknown> | undefined;

    public constructor(message: string, context?: Record<string, unknown>) {
        super(message);
        this.name = 'SduiAuthError';
        this.context = context;
    }
}
