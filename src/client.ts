import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { authenticateWithWebUntis } from './auth/webUntisAuth.js';
import { DEFAULT_USER_AGENT, SDUI_API_BASE_URL } from './constants.js';
import type {
    AuthenticateWithWebUntisOptions,
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

    public getHttpClient(): AxiosInstance {
        return this.http;
    }
}
