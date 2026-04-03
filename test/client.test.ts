import nock from 'nock';
import { describe, expect, it } from 'vitest';
import { SduiClient } from '../src/client.js';

describe('SduiClient', () => {
    it('uses bearer token when fetching current user', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-123',
            },
        })
            .get('/v1/users/self')
            .reply(200, { id: 'u-1', displayName: 'Ada' });

        const client = SduiClient.fromAccessToken('token-123');
        const user = await client.getCurrentUser<{
            id: string;
            displayName: string;
        }>();

        expect(user).toEqual({ id: 'u-1', displayName: 'Ada' });
        expect(scope.isDone()).toBe(true);
    });

    it('sends arbitrary requests through request()', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-456',
            },
        })
            .post('/v1/messages', { text: 'hello' })
            .reply(201, { ok: true });

        const client = SduiClient.fromAccessToken('token-456');
        const result = await client.request<{ ok: boolean }>({
            method: 'POST',
            url: '/v1/messages',
            data: { text: 'hello' },
        });

        expect(result).toEqual({ ok: true });
        expect(scope.isDone()).toBe(true);
    });
});
