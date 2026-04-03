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

export interface GetUserNewsOptions {
    page?: number;
    search?: string;
}

export interface GetUserChatsOptions {
    page?: number;
    search?: string;
    limit?: number;
}

export interface GetChatMessagesOptions {
    page?: number;
}

export interface GetMessageReadersOptions {
    page?: number;
    search?: string;
}

export type MarkChatAsReadPayload = Record<string, unknown>;

export type SendChatMessagePayload = {
    content: string;
} & Record<string, string | number | boolean | null | undefined>;

export interface SduiAuthResult {
    accessToken: string;
    http: AxiosInstance;
}
