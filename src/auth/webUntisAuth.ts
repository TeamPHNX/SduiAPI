import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import {
    DEFAULT_REDIRECT_HOP_LIMIT,
    DEFAULT_REQUEST_HEADERS,
    DEFAULT_USER_AGENT,
    SDUI_API_BASE_URL,
    SDUI_IDP_RETURN_URL,
} from '../constants.js';
import { SduiAuthError } from '../errors.js';
import type {
    AuthenticateWithWebUntisOptions,
    SduiAuthResult,
    WebUntisCredentials,
} from '../types.js';
import { emitLog } from '../utils/logging.js';
import {
    extractCsrfToken,
    extractMetaRefreshUrl,
    maskSecret,
} from '../utils/parsers.js';
import { buildSduiAuthorizeUrl, resolveRedirectUrl } from '../utils/url.js';

interface FindSchoolsResponse {
    data?: {
        meta?: {
            external_identity_providers?: Array<{
                uri?: string;
            }>;
        };
    };
}

interface LoginIdmResponse {
    data?: {
        access_token?: string;
    };
    access_token?: string;
}

function createBrowserLikeHttpClient(userAgent: string): AxiosInstance {
    const cookieJar = new CookieJar();

    return wrapper(
        axios.create({
            maxRedirects: 10,
            validateStatus: () => true,
            jar: cookieJar,
            withCredentials: true,
            headers: {
                ...DEFAULT_REQUEST_HEADERS,
                'User-Agent': userAgent,
            },
        }),
    );
}

function getFinalResponseUrl(response: AxiosResponse): string | null {
    const req = response.request as
        | {
              res?: {
                  responseUrl?: string;
              };
          }
        | undefined;

    return req?.res?.responseUrl ?? null;
}

function readLocationHeader(response: AxiosResponse): string | null {
    const location = response.headers.location;
    if (typeof location === 'string') {
        return location;
    }
    if (Array.isArray(location) && typeof location[0] === 'string') {
        return location[0];
    }

    return null;
}

function isRedirectStatus(statusCode: number): boolean {
    return [301, 302, 303, 307, 308].includes(statusCode);
}

async function followUntilSduiCallback(
    http: AxiosInstance,
    startUrl: string,
    hopLimit: number,
    logger: AuthenticateWithWebUntisOptions['logger'],
): Promise<string | null> {
    let nextUrl = startUrl;

    for (let hop = 1; hop <= hopLimit; hop += 1) {
        const response = await http.get<string>(nextUrl, {
            maxRedirects: 0,
            responseType: 'text',
            validateStatus: () => true,
        });

        const location = readLocationHeader(response);

        emitLog(
            logger,
            'callback.redirect',
            'Following redirect during callback resolution.',
            {
                hop,
                statusCode: response.status,
                hasLocation: Boolean(location),
            },
        );

        if (!location || !isRedirectStatus(response.status)) {
            return null;
        }

        const resolvedUrl = resolveRedirectUrl(nextUrl, location);
        if (resolvedUrl.startsWith('https://sdui.app/')) {
            return resolvedUrl;
        }

        nextUrl = resolvedUrl;
    }

    return null;
}

export async function authenticateWithWebUntis(
    credentials: WebUntisCredentials,
    options: AuthenticateWithWebUntisOptions = {},
): Promise<SduiAuthResult> {
    const schoolSlink = credentials.schoolSlink.trim();
    const username = credentials.username.trim();
    const password = credentials.password;

    if (!schoolSlink || !username || !password) {
        throw new SduiAuthError(
            'schoolSlink, username and password are required.',
        );
    }

    const redirectHopLimit =
        options.redirectHopLimit ?? DEFAULT_REDIRECT_HOP_LIMIT;
    if (redirectHopLimit < 1) {
        throw new SduiAuthError('redirectHopLimit must be at least 1.');
    }

    const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    const http = createBrowserLikeHttpClient(userAgent);

    emitLog(
        options.logger,
        'school.lookup',
        'Looking up school configuration.',
        { schoolSlink },
    );

    const schoolResponse = await http.get<FindSchoolsResponse>(
        `${SDUI_API_BASE_URL}/v1/find-schools`,
        {
            params: { slink: schoolSlink },
        },
    );

    const idpUri =
        schoolResponse.data?.data?.meta?.external_identity_providers?.[0]
            ?.uri ?? null;
    if (!idpUri) {
        throw new SduiAuthError(
            'Unable to resolve identity provider URL for school.',
            {
                schoolSlink,
                statusCode: schoolResponse.status,
            },
        );
    }

    const authorizeUrl = buildSduiAuthorizeUrl(idpUri, schoolSlink);

    emitLog(options.logger, 'idp.bridge', 'Triggering SDUI SSO bridge.');

    const idpResponse = await http.get<string>(authorizeUrl, {
        responseType: 'text',
    });

    const webUntisInitUrl = extractMetaRefreshUrl(idpResponse.data);
    if (!webUntisInitUrl) {
        throw new SduiAuthError(
            'Failed to read WebUntis URL from IDP response.',
        );
    }

    emitLog(
        options.logger,
        'idp.meta-refresh',
        'Resolved meta refresh target.',
        {
            webUntisInitUrl,
        },
    );

    const loginPageResponse = await http.get<string>(webUntisInitUrl, {
        responseType: 'text',
    });

    const csrfToken = extractCsrfToken(loginPageResponse.data);
    if (!csrfToken) {
        throw new SduiAuthError(
            'Could not extract csrfToken from WebUntis page.',
        );
    }

    emitLog(options.logger, 'webuntis.csrf', 'Extracted WebUntis CSRF token.', {
        csrfToken: maskSecret(csrfToken),
    });

    const loginPageUrl =
        getFinalResponseUrl(loginPageResponse) ?? webUntisInitUrl;
    const parsedLoginPageUrl = new URL(loginPageUrl);
    const webUntisBaseUrl = `${parsedLoginPageUrl.protocol}//${parsedLoginPageUrl.host}`;
    const schoolFromLoginUrl =
        parsedLoginPageUrl.searchParams.get('school') ?? schoolSlink;

    const loginFormPayload = new URLSearchParams({
        school: schoolFromLoginUrl,
        j_username: username,
        j_password: password,
    });

    emitLog(
        options.logger,
        'webuntis.login',
        'Submitting WebUntis credentials.',
        {
            webUntisBaseUrl,
            username,
        },
    );

    const loginResponse = await http.post(
        `${webUntisBaseUrl}/WebUntis/j_spring_security_check`,
        loginFormPayload.toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
            },
            maxRedirects: 0,
            validateStatus: () => true,
        },
    );

    emitLog(
        options.logger,
        'webuntis.login.done',
        'WebUntis login request finished.',
        {
            statusCode: loginResponse.status,
        },
    );

    const sduiCallbackUrl = await followUntilSduiCallback(
        http,
        webUntisInitUrl,
        redirectHopLimit,
        options.logger,
    );

    if (!sduiCallbackUrl) {
        throw new SduiAuthError(
            'WebUntis did not redirect to SDUI callback URL. Credentials may be invalid or flow changed.',
        );
    }

    const callbackUrl = new URL(sduiCallbackUrl);
    const code1 = callbackUrl.searchParams.get('code');
    const state1 = callbackUrl.searchParams.get('state');

    if (!code1 || !state1) {
        throw new SduiAuthError('Missing code/state in SDUI callback URL.', {
            callbackUrl: sduiCallbackUrl,
        });
    }

    emitLog(
        options.logger,
        'idp.exchange.1',
        'Exchanging first SDUI bridge code.',
        {
            code: maskSecret(code1),
        },
    );

    const idpExchangeResponse = await http.get(SDUI_IDP_RETURN_URL, {
        params: {
            code: code1,
            state: state1,
        },
        maxRedirects: 0,
        validateStatus: () => true,
    });

    const ssoVerifyLocation = readLocationHeader(idpExchangeResponse);

    if (!isRedirectStatus(idpExchangeResponse.status) || !ssoVerifyLocation) {
        throw new SduiAuthError(
            'Failed to exchange code at SDUI identity bridge.',
            {
                statusCode: idpExchangeResponse.status,
            },
        );
    }

    const ssoVerifyUrl = resolveRedirectUrl(
        SDUI_IDP_RETURN_URL,
        ssoVerifyLocation,
    );
    const code2 = new URL(ssoVerifyUrl).searchParams.get('code');

    if (!code2) {
        throw new SduiAuthError('Missing code in SSO verify redirect URL.', {
            ssoVerifyUrl,
        });
    }

    emitLog(
        options.logger,
        'idp.exchange.2',
        'Exchanging second code for API token.',
        {
            code: maskSecret(code2),
        },
    );

    const tokenResponse = await http.post<LoginIdmResponse>(
        `${SDUI_API_BASE_URL}/v1/auth/login-idm`,
        {
            code: code2,
            slink: schoolSlink,
        },
    );

    const accessToken =
        tokenResponse.data?.data?.access_token ??
        tokenResponse.data?.access_token;

    if (!accessToken) {
        throw new SduiAuthError(
            'Token exchange succeeded but no access token was returned.',
            {
                statusCode: tokenResponse.status,
                responseBody: tokenResponse.data,
            },
        );
    }

    emitLog(options.logger, 'auth.success', 'Authentication completed.', {
        accessToken: maskSecret(accessToken),
    });

    const authenticatedHttp = axios.create({
        baseURL: SDUI_API_BASE_URL,
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': userAgent,
        },
    });

    return {
        accessToken,
        http: authenticatedHttp,
    };
}
