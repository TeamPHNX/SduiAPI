import { describe, expect, it } from 'vitest';
import { extractMetaRefreshUrl } from '../src/utils/parsers.js';

describe('extractMetaRefreshUrl', () => {
    it('ignores tokens after the URL in the content attribute', () => {
        // Shape of SDUI's identity bridge page
        const html = `<meta http-equiv='refresh' content='0; url=https://api.webuntis.com/WebUntis/api/sso/v3/1/authorize?scope=openid&amp;client_id=Sdui&amp;code_challenge=abc123 target=_top' />`;
        expect(extractMetaRefreshUrl(html)).toBe(
            'https://api.webuntis.com/WebUntis/api/sso/v3/1/authorize?scope=openid&client_id=Sdui&code_challenge=abc123',
        );
    });

    it('still reads a plain meta refresh URL', () => {
        const html = '<meta http-equiv="refresh" content="0;url=https://example.com/a?b=1&amp;c=2">';
        expect(extractMetaRefreshUrl(html)).toBe('https://example.com/a?b=1&c=2');
    });

    it('returns null without a meta refresh', () => {
        expect(extractMetaRefreshUrl('<html></html>')).toBeNull();
    });
});
