import type { AxiosInstance } from 'axios';

export interface WebUntisCredentials {
    schoolSlink: string;
    username: string;
    password: string;
}

export interface AuthLogEvent {
    step: string;
    message: string;
    details?: Record<string, unknown>;
}

export type AuthLogger = (event: AuthLogEvent) => void;

export interface AuthenticateWithWebUntisOptions {
    redirectHopLimit?: number;
    userAgent?: string;
    logger?: AuthLogger;
}

export interface SduiAuthResult {
    accessToken: string;
    http: AxiosInstance;
}
