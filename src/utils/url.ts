export function buildSduiAuthorizeUrl(
    idpUri: string,
    schoolSlink: string,
): string {
    const redirectUri = `https://sdui.app/sso-verify/${schoolSlink}`;
    const statePayload = {
        branding: 'UNTIS',
        slink: schoolSlink,
        goBackToParentWindow: false,
    };

    return `${idpUri}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(JSON.stringify(statePayload))}`;
}

export function resolveRedirectUrl(baseUrl: string, location: string): string {
    return new URL(location, baseUrl).toString();
}
