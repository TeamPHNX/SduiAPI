import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { authenticateWithWebUntis } from './auth/webUntisAuth.js';
import { DEFAULT_USER_AGENT, SDUI_API_BASE_URL } from './constants.js';
import type {
    AuthenticateWithWebUntisOptions,
    GetChatMessagesOptions,
    GetMessageReadersOptions,
    GetUserChatsOptions,
    GetUserNewsOptions,
    MarkChatAsReadPayload,
    SendChatMessagePayload,
    WebUntisCredentials,
} from './types.js';

export class SduiClient {
    public readonly accessToken: string;
    private readonly http: AxiosInstance;

    private constructor(accessToken: string, http: AxiosInstance) {
        this.accessToken = accessToken;
        this.http = http;
    }

    public static async authenticateWithWebUntis(
        credentials: WebUntisCredentials,
        options: AuthenticateWithWebUntisOptions = {},
    ): Promise<SduiClient> {
        const { accessToken, http } = await authenticateWithWebUntis(
            credentials,
            options,
        );
        return new SduiClient(accessToken, http);
    }

    public static fromAccessToken(
        accessToken: string,
        userAgent: string = DEFAULT_USER_AGENT,
    ): SduiClient {
        const http = axios.create({
            baseURL: SDUI_API_BASE_URL,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': userAgent,
            },
        });

        return new SduiClient(accessToken, http);
    }

    public async request<T>(config: AxiosRequestConfig): Promise<T> {
        const response = await this.http.request<T>(config);
        return response.data;
    }

    public async getCurrentUser<T = unknown>(): Promise<T> {
        return this.request<T>({
            method: 'GET',
            url: '/v1/users/self',
        });
    }

    public async getUserNews<T = unknown>(
        userId: string | number,
        options: GetUserNewsOptions = {},
    ): Promise<T> {
        const normalizedUserId = String(userId).trim();
        if (!normalizedUserId) {
            throw new TypeError('userId is required.');
        }

        const page = options.page ?? 1;
        if (!Number.isInteger(page) || page < 1) {
            throw new RangeError('page must be a positive integer.');
        }

        const search = options.search ?? '';

        return this.request<T>({
            method: 'GET',
            url: `/v1/users/${encodeURIComponent(normalizedUserId)}/feed/news`,
            params: {
                page,
                search,
            },
        });
    }

    public async getUserChats<T = unknown>(
        userId: string | number,
        options: GetUserChatsOptions = {},
    ): Promise<T> {
        const normalizedUserId = String(userId).trim();
        if (!normalizedUserId) {
            throw new TypeError('userId is required.');
        }

        const page = options.page ?? 1;
        if (!Number.isInteger(page) || page < 1) {
            throw new RangeError('page must be a positive integer.');
        }

        const limit = options.limit ?? 10;
        if (!Number.isInteger(limit) || limit < 1) {
            throw new RangeError('limit must be a positive integer.');
        }

        const search = options.search ?? '';

        return this.request<T>({
            method: 'GET',
            url: `/v1/users/${encodeURIComponent(normalizedUserId)}/channels/chats`,
            params: {
                page,
                search,
                limit,
            },
        });
    }

    public async getChatMessages<T = unknown>(
        chatId: string | number,
        options: GetChatMessagesOptions = {},
    ): Promise<T> {
        const normalizedChatId = String(chatId).trim();
        if (!normalizedChatId) {
            throw new TypeError('chatId is required.');
        }

        const page = options.page ?? 1;
        if (!Number.isInteger(page) || page < 1) {
            throw new RangeError('page must be a positive integer.');
        }

        return this.request<T>({
            method: 'GET',
            url: `/v1/channels/chats/${encodeURIComponent(normalizedChatId)}/messages`,
            params: {
                page,
            },
        });
    }

    public async getMessageReaders<T = unknown>(
        chatId: string | number,
        messageUuid: string | number,
        options: GetMessageReadersOptions = {},
    ): Promise<T> {
        const normalizedChatId = String(chatId).trim();
        if (!normalizedChatId) {
            throw new TypeError('chatId is required.');
        }

        const normalizedMessageUuid = String(messageUuid).trim();
        if (!normalizedMessageUuid) {
            throw new TypeError('messageUuid is required.');
        }

        const page = options.page ?? 1;
        if (!Number.isInteger(page) || page < 1) {
            throw new RangeError('page must be a positive integer.');
        }

        const search = options.search ?? '';

        return this.request<T>({
            method: 'GET',
            url: `/v1/channels/chats/${encodeURIComponent(normalizedChatId)}/messages/${encodeURIComponent(normalizedMessageUuid)}/readers`,
            params: {
                page,
                search,
            },
        });
    }

    public async markChatAsRead<T = unknown>(
        chatId: string | number,
        payload: MarkChatAsReadPayload = {},
    ): Promise<T> {
        const normalizedChatId = String(chatId).trim();
        if (!normalizedChatId) {
            throw new TypeError('chatId is required.');
        }

        return this.request<T>({
            method: 'POST',
            url: `/v1/channels/chats/${encodeURIComponent(normalizedChatId)}/read`,
            data: payload,
        });
    }

    public async sendChatMessage<T = unknown>(
        chatId: string | number,
        payload: SendChatMessagePayload,
    ): Promise<T> {
        const normalizedChatId = String(chatId).trim();
        if (!normalizedChatId) {
            throw new TypeError('chatId is required.');
        }

        if (typeof payload?.content !== 'string') {
            throw new TypeError('content must be a string.');
        }

        if (!payload.content.trim()) {
            throw new TypeError('content is required.');
        }

        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
            if (value === undefined || value === null) {
                continue;
            }

            formData.append(key, String(value));
        }

        return this.request<T>({
            method: 'POST',
            url: `/v1/channels/chats/${encodeURIComponent(normalizedChatId)}/messages`,
            data: formData,
        });
    }

    public async replyToChatMessage<T = unknown>(
        chatId: string | number,
        replyUuid: string | number,
        payload: SendChatMessagePayload,
    ): Promise<T> {
        const normalizedReplyUuid = String(replyUuid).trim();
        if (!normalizedReplyUuid) {
            throw new TypeError('replyUuid is required.');
        }

        return this.sendChatMessage<T>(chatId, {
            ...payload,
            reply_uuid: normalizedReplyUuid,
        });
    }

    public async deleteChatMessage<T = unknown>(
        chatId: string | number,
        messageUuid: string | number,
    ): Promise<T> {
        const normalizedChatId = String(chatId).trim();
        if (!normalizedChatId) {
            throw new TypeError('chatId is required.');
        }

        const normalizedMessageUuid = String(messageUuid).trim();
        if (!normalizedMessageUuid) {
            throw new TypeError('messageUuid is required.');
        }

        return this.request<T>({
            method: 'DELETE',
            url: `/v1/channels/chats/${encodeURIComponent(normalizedChatId)}/messages/${encodeURIComponent(normalizedMessageUuid)}`,
        });
    }

    public async getChannelUsers<T = unknown>(
        channelId: string | number,
    ): Promise<T> {
        const normalizedChannelId = String(channelId).trim();
        if (!normalizedChannelId) {
            throw new TypeError('channelId is required.');
        }

        return this.request<T>({
            method: 'GET',
            url: `/v1/channels/${encodeURIComponent(normalizedChannelId)}/users`,
        });
    }

    public getHttpClient(): AxiosInstance {
        return this.http;
    }
}
