import nock from 'nock';
import { describe, expect, it } from 'vitest';
import { authenticateWithWebUntis } from '../src/auth/webUntisAuth.js';
import { SduiAuthError } from '../src/errors.js';
import type { AuthLogEvent } from '../src/types.js';

describe('authenticateWithWebUntis', () => {
    it('completes auth flow and returns authenticated API client', async () => {
        const schoolSlink = 'example-school';
        const username = 'student1';
        const password = 'secret123';
        const idpAuthorizeBase =
            'https://idp-webuntis.example/oauth2/authorize?client_id=sdui-web';
        const webUntisInitUrl =
            'https://webuntis.example/sso/start?school=example-school';
        const callback1 =
            'https://sdui.app/sso-verify/example-school?code=first-code&state=state-abc';
        const callback2 =
            'https://sdui.app/sso-verify/example-school?code=second-code';

        nock('https://api.sdui.app')
            .get('/v1/find-schools')
            .query({ slink: schoolSlink })
            .reply(200, {
                data: {
                    meta: {
                        external_identity_providers: [{ uri: idpAuthorizeBase }],
                    },
                },
            });

        nock('https://idp-webuntis.example')
            .get('/oauth2/authorize')
            .query((query) => {
                const record = query as Record<string, string | string[] | undefined>;
                return (
                    record.client_id === 'sdui-web' &&
                    typeof record.redirect_uri === 'string' &&
                    typeof record.state === 'string'
                );
            })
            .reply(
                200,
                `<meta http-equiv="refresh" content="0;url=${webUntisInitUrl}">`,
            );

        nock('https://webuntis.example')
            .get('/sso/start')
            .query({ school: schoolSlink })
            .reply(200, `<script>window.config={"csrfToken":"csrf-value-123"}</script>`);

        nock('https://webuntis.example')
            .post('/WebUntis/j_spring_security_check')
            .matchHeader('x-requested-with', 'XMLHttpRequest')
            .reply(302, undefined, { Location: '/home' });

        nock('https://webuntis.example')
            .get('/sso/start')
            .query({ school: schoolSlink })
            .reply(302, undefined, { Location: '/continue' });

        nock('https://webuntis.example')
            .get('/continue')
            .reply(302, undefined, { Location: callback1 });

        nock('https://idp.sdui.app')
            .get('/api/auth/return')
            .query({ code: 'first-code', state: 'state-abc' })
            .reply(302, undefined, { Location: callback2 });

        nock('https://api.sdui.app')
            .post('/v1/auth/login-idm', {
                code: 'second-code',
                slink: schoolSlink,
            })
            .reply(200, {
                data: {
                    access_token: 'token-final-123',
                },
            });

        const userScope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-final-123',
            },
        })
            .get('/v1/users/self')
            .reply(200, { id: 'u-1' });

        const events: AuthLogEvent[] = [];

        const result = await authenticateWithWebUntis(
            {
                schoolSlink,
                username,
                password,
            },
            {
                logger: (event) => {
                    events.push(event);
                },
            },
        );

        expect(result.accessToken).toBe('token-final-123');
        expect(events.some((event) => event.step === 'auth.success')).toBe(true);

        const me = await result.http.get<{ id: string }>('/v1/users/self');
        expect(me.data).toEqual({ id: 'u-1' });
        expect(userScope.isDone()).toBe(true);
    });

    it('throws for missing credentials', async () => {
        await expect(
            authenticateWithWebUntis({
                schoolSlink: '',
                username: 'x',
                password: 'y',
            }),
        ).rejects.toBeInstanceOf(SduiAuthError);
    });

    it('throws when idp response does not include meta refresh URL', async () => {
        const schoolSlink = 'example-school';
        const idpAuthorizeBase =
            'https://idp-webuntis.example/oauth2/authorize?client_id=sdui-web';

        nock('https://api.sdui.app')
            .get('/v1/find-schools')
            .query({ slink: schoolSlink })
            .reply(200, {
                data: {
                    meta: {
                        external_identity_providers: [{ uri: idpAuthorizeBase }],
                    },
                },
            });

        nock('https://idp-webuntis.example')
            .get('/oauth2/authorize')
            .query(true)
            .reply(200, '<html><body>No redirect here</body></html>');

        await expect(
            authenticateWithWebUntis({
                schoolSlink,
                username: 'student1',
                password: 'secret123',
            }),
        ).rejects.toThrowError(/webuntis url/i);
    });
});
