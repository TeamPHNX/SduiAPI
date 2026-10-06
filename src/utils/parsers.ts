const META_REFRESH_URL_PATTERN =
    /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>]+)["']/i;
const CSRF_TOKEN_PATTERN = /"csrfToken":"([^"]+)"/i;

export function extractMetaRefreshUrl(html: string): string | null {
    const match = META_REFRESH_URL_PATTERN.exec(html);
    if (!match?.[1]) {
        return null;
    }

    // The content attribute can carry tokens after the URL: SDUI's bridge page
    // sends `content='0; url=https://...&code_challenge=XYZ target=_top'`.
    // Keeping " target=_top" corrupted the PKCE code_challenge and WebUntis
    // rejected the authorize request. A URL never contains raw whitespace.
    const url = match[1].replaceAll('&amp;', '&').trim().split(/\s+/)[0];
    return url || null;
}

export function extractCsrfToken(html: string): string | null {
    const match = CSRF_TOKEN_PATTERN.exec(html);
    return match?.[1] ?? null;
}

export function maskSecret(secret: string, visiblePrefixLength = 5): string {
    if (secret.length <= visiblePrefixLength) {
        return `${secret}...`;
    }

    return `${secret.slice(0, visiblePrefixLength)}...`;
}
