export const SDUI_API_BASE_URL = 'https://api.sdui.app';
export const SDUI_IDP_RETURN_URL = 'https://idp.sdui.app/api/auth/return';

export const DEFAULT_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const DEFAULT_REQUEST_HEADERS = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
} as const;

export const DEFAULT_REDIRECT_HOP_LIMIT = 5;
