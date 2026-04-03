import type { AuthLogEvent, AuthLogger } from '../types.js';

export function emitLog(
    logger: AuthLogger | undefined,
    step: string,
    message: string,
    details?: Record<string, unknown>,
): void {
    if (!logger) {
        return;
    }

    const event: AuthLogEvent = { step, message };
    if (details) {
        event.details = details;
    }

    logger(event);
}
