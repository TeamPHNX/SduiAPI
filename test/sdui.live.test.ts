import { describe, expect, it } from 'vitest';
import { authenticateWithWebUntis } from '../src/auth/webUntisAuth.js';

const liveEnabled =
    (process.env.SDUI_LIVE_TEST ?? 'false').toLowerCase() === 'true';
const schoolSlink =
    process.env.SDUI_SCHOOL_SLINK?.trim() || 'example-school';
const username = process.env.SDUI_USERNAME?.trim() || '';
const password = process.env.SDUI_PASSWORD || '';

const shouldRunLive = liveEnabled && Boolean(username) && Boolean(password);
const liveIt = shouldRunLive ? it : it.skip;

describe('live SDUI integration', () => {
    liveIt('authenticates and fetches the current SDUI user', async () => {
        const result = await authenticateWithWebUntis({
            schoolSlink,
            username,
            password,
        });

        expect(result.accessToken.length).toBeGreaterThan(20);
        console.log('Bearer token:', result.accessToken);

        const me = await result.http.get('/v1/users/self');
        expect(me.status).toBe(200);
        expect(me.data).toBeTruthy();
    }, 120000);

    it('requires credentials if SDUI_LIVE_TEST=true', async () => {
        if (!liveEnabled) {
            return;
        }

        expect(username.length).toBeGreaterThan(0);
        expect(password.length).toBeGreaterThan(0);
    });
});
