const META_REFRESH_URL_PATTERN =
    /<meta[^>]+http-equiv=["']?refresh["']?[^>]*content=["'][^"']*url=([^"'>]+)["']/i;
const CSRF_TOKEN_PATTERN = /"csrfToken":"([^"]+)"/i;

export function extractMetaRefreshUrl(html: string): string | null {
    const match = META_REFRESH_URL_PATTERN.exec(html);
    if (!match?.[1]) {
        return null;
    }

    return match[1].replaceAll('&amp;', '&').trim();
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
