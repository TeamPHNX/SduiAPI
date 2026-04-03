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

    it('fetches user news with page and search query params', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-789',
            },
        })
            .get('/v1/users/user-id-placeholder/feed/news')
            .query({ page: 2, search: 'announcement' })
            .reply(200, {
                data: [{ id: 'news-1' }],
                meta: { page: 2 },
            });

        const client = SduiClient.fromAccessToken('token-789');
        const result = await client.getUserNews<{
            data: Array<{ id: string }>;
            meta: { page: number };
        }>('user-id-placeholder', {
            page: 2,
            search: 'announcement',
        });

        expect(result).toEqual({
            data: [{ id: 'news-1' }],
            meta: { page: 2 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('uses default page and empty search for user news', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-default-news',
            },
        })
            .get('/v1/users/user-id-placeholder/feed/news')
            .query({ page: 1, search: '' })
            .reply(200, {
                data: [],
                meta: { page: 1 },
            });

        const client = SduiClient.fromAccessToken('token-default-news');
        const result = await client.getUserNews<{
            data: unknown[];
            meta: { page: number };
        }>('user-id-placeholder');

        expect(result).toEqual({
            data: [],
            meta: { page: 1 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects invalid page values for user news', async () => {
        const client = SduiClient.fromAccessToken('token-errors');

        await expect(
            client.getUserNews('user-id-placeholder', { page: 0 }),
        ).rejects.toThrow('page must be a positive integer.');
    });

    it('fetches user chats with page, search and limit params', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-chats',
            },
        })
            .get('/v1/users/user-id-placeholder/channels/chats')
            .query({ page: 2, search: '', limit: 10 })
            .reply(200, {
                data: [{ id: 'chat-1' }],
                meta: { page: 2, limit: 10 },
            });

        const client = SduiClient.fromAccessToken('token-chats');
        const result = await client.getUserChats<{
            data: Array<{ id: string }>;
            meta: { page: number; limit: number };
        }>('user-id-placeholder', {
            page: 2,
            search: '',
            limit: 10,
        });

        expect(result).toEqual({
            data: [{ id: 'chat-1' }],
            meta: { page: 2, limit: 10 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('uses default params for user chats', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-chats-defaults',
            },
        })
            .get('/v1/users/user-id-placeholder/channels/chats')
            .query({ page: 1, search: '', limit: 10 })
            .reply(200, {
                data: [],
                meta: { page: 1, limit: 10 },
            });

        const client = SduiClient.fromAccessToken('token-chats-defaults');
        const result = await client.getUserChats<{
            data: unknown[];
            meta: { page: number; limit: number };
        }>('user-id-placeholder');

        expect(result).toEqual({
            data: [],
            meta: { page: 1, limit: 10 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('fetches chat messages with page query param', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-messages',
            },
        })
            .get('/v1/channels/chats/chat-id-placeholder/messages')
            .query({ page: 1 })
            .reply(200, {
                data: [{ id: 'message-1' }],
                meta: { page: 1 },
            });

        const client = SduiClient.fromAccessToken('token-messages');
        const result = await client.getChatMessages<{
            data: Array<{ id: string }>;
            meta: { page: number };
        }>('chat-id-placeholder', {
            page: 1,
        });

        expect(result).toEqual({
            data: [{ id: 'message-1' }],
            meta: { page: 1 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('uses default page for chat messages', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-messages-default',
            },
        })
            .get('/v1/channels/chats/chat-id-placeholder/messages')
            .query({ page: 1 })
            .reply(200, {
                data: [],
                meta: { page: 1 },
            });

        const client = SduiClient.fromAccessToken('token-messages-default');
        const result = await client.getChatMessages<{
            data: unknown[];
            meta: { page: number };
        }>('chat-id-placeholder');

        expect(result).toEqual({
            data: [],
            meta: { page: 1 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects invalid page values for chat messages', async () => {
        const client = SduiClient.fromAccessToken('token-messages-errors');

        await expect(
            client.getChatMessages('chat-id-placeholder', { page: 0 }),
        ).rejects.toThrow('page must be a positive integer.');
    });

    it('rejects missing chat id for chat messages', async () => {
        const client = SduiClient.fromAccessToken('token-messages-errors');

        await expect(client.getChatMessages('   ')).rejects.toThrow(
            'chatId is required.',
        );
    });

    it('fetches message readers with page and search query params', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-readers',
            },
        })
            .get(
                '/v1/channels/chats/readers-chat-id-placeholder/messages/readers-message-uuid-placeholder/readers',
            )
            .query({ page: 1, search: '' })
            .reply(200, {
                data: [{ id: 'reader-1' }],
                meta: { current_page: 1 },
            });

        const client = SduiClient.fromAccessToken('token-readers');
        const result = await client.getMessageReaders<{
            data: Array<{ id: string }>;
            meta: { current_page: number };
        }>('readers-chat-id-placeholder', 'readers-message-uuid-placeholder', {
            page: 1,
            search: '',
        });

        expect(result).toEqual({
            data: [{ id: 'reader-1' }],
            meta: { current_page: 1 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('uses default params for message readers', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-readers-defaults',
            },
        })
            .get(
                '/v1/channels/chats/readers-chat-id-placeholder/messages/readers-message-uuid-placeholder/readers',
            )
            .query({ page: 1, search: '' })
            .reply(200, {
                data: [],
                meta: { current_page: 1 },
            });

        const client = SduiClient.fromAccessToken('token-readers-defaults');
        const result = await client.getMessageReaders<{
            data: unknown[];
            meta: { current_page: number };
        }>('readers-chat-id-placeholder', 'readers-message-uuid-placeholder');

        expect(result).toEqual({
            data: [],
            meta: { current_page: 1 },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects invalid page values for message readers', async () => {
        const client = SduiClient.fromAccessToken('token-readers-errors');

        await expect(
            client.getMessageReaders(
                'readers-chat-id-placeholder',
                'readers-message-uuid-placeholder',
                { page: 0 },
            ),
        ).rejects.toThrow('page must be a positive integer.');
    });

    it('rejects missing chat id for message readers', async () => {
        const client = SduiClient.fromAccessToken('token-readers-errors');

        await expect(
            client.getMessageReaders('   ', 'readers-message-uuid-placeholder'),
        ).rejects.toThrow('chatId is required.');
    });

    it('rejects missing message uuid for message readers', async () => {
        const client = SduiClient.fromAccessToken('token-readers-errors');

        await expect(client.getMessageReaders('readers-chat-id-placeholder', '   ')).rejects.toThrow(
            'messageUuid is required.',
        );
    });

    it('marks a chat as read with default payload', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-chat-read',
            },
        })
            .post('/v1/channels/chats/read-chat-id-placeholder/read', {})
            .reply(200, {
                data: null,
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-chat-read');
        const result = await client.markChatAsRead<{
            data: null;
            status: string;
            meta: {
                warnings: unknown[];
                errors: unknown[];
                success: unknown[];
            };
        }>('read-chat-id-placeholder');

        expect(result).toEqual({
            data: null,
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('marks a chat as read with custom payload', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-chat-read-custom',
            },
        })
            .post('/v1/channels/chats/read-chat-id-placeholder/read', {
                source: 'chat-open',
            })
            .reply(200, {
                data: null,
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-chat-read-custom');
        const result = await client.markChatAsRead<{
            status: string;
        }>('read-chat-id-placeholder', {
            source: 'chat-open',
        });

        expect(result).toEqual({
            data: null,
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects missing chat id for markChatAsRead', async () => {
        const client = SduiClient.fromAccessToken('token-chat-read-errors');

        await expect(client.markChatAsRead('   ')).rejects.toThrow(
            'chatId is required.',
        );
    });

    it('sends a chat message as multipart form data', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-send-message',
            },
        })
            .matchHeader('content-type', /multipart\/form-data; boundary=/)
            .post('/v1/channels/chats/message-chat-id-placeholder/messages', (body) => {
                const bodyString =
                    typeof body === 'string' ? body : String(body);

                return (
                    bodyString.includes('name="content"') &&
                    bodyString.includes('\r\n.\r\n')
                );
            })
            .reply(200, {
                data: {
                    uuid: 'message-1',
                    content: '.',
                },
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-send-message');
        const result = await client.sendChatMessage<{
            data: {
                uuid: string;
                content: string;
            };
            status: string;
        }>('message-chat-id-placeholder', {
            content: '.',
        });

        expect(result).toEqual({
            data: {
                uuid: 'message-1',
                content: '.',
            },
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('sends extra multipart fields for chat messages', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-send-message-extra',
            },
        })
            .matchHeader('content-type', /multipart\/form-data; boundary=/)
            .post('/v1/channels/chats/message-chat-id-placeholder/messages', (body) => {
                const bodyString =
                    typeof body === 'string' ? body : String(body);

                return (
                    bodyString.includes('name="content"') &&
                    bodyString.includes('name="reply_uuid"') &&
                    bodyString.includes('reply-123')
                );
            })
            .reply(200, {
                data: {
                    uuid: 'message-2',
                    content: 'hello',
                    reply_uuid: 'reply-123',
                },
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-send-message-extra');
        const result = await client.sendChatMessage<{
            data: {
                uuid: string;
                content: string;
                reply_uuid: string;
            };
        }>('message-chat-id-placeholder', {
            content: 'hello',
            reply_uuid: 'reply-123',
        });

        expect(result).toEqual({
            data: {
                uuid: 'message-2',
                content: 'hello',
                reply_uuid: 'reply-123',
            },
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects missing chat id for sendChatMessage', async () => {
        const client = SduiClient.fromAccessToken('token-send-message-errors');

        await expect(
            client.sendChatMessage('   ', { content: '.' }),
        ).rejects.toThrow('chatId is required.');
    });

    it('rejects empty content for sendChatMessage', async () => {
        const client = SduiClient.fromAccessToken('token-send-message-errors');

        await expect(
            client.sendChatMessage('message-chat-id-placeholder', { content: '   ' }),
        ).rejects.toThrow('content is required.');
    });

    it('replies to a chat message using reply_uuid', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-reply-message',
            },
        })
            .matchHeader('content-type', /multipart\/form-data; boundary=/)
            .post('/v1/channels/chats/message-chat-id-placeholder/messages', (body) => {
                const bodyString =
                    typeof body === 'string' ? body : String(body);

                return (
                    bodyString.includes('name="content"') &&
                    bodyString.includes('Hallo') &&
                    bodyString.includes('name="reply_uuid"') &&
                    bodyString.includes(
                        'message-uuid-placeholder',
                    )
                );
            })
            .reply(200, {
                data: {
                    uuid: 'message-reply-1',
                    content: 'Hallo',
                    reply_uuid: 'message-uuid-placeholder',
                },
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-reply-message');
        const result = await client.replyToChatMessage<{
            data: {
                uuid: string;
                content: string;
                reply_uuid: string;
            };
        }>(
            'message-chat-id-placeholder',
            'message-uuid-placeholder',
            {
                content: 'Hallo',
            },
        );

        expect(result).toEqual({
            data: {
                uuid: 'message-reply-1',
                content: 'Hallo',
                reply_uuid: 'message-uuid-placeholder',
            },
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects missing reply uuid for replyToChatMessage', async () => {
        const client = SduiClient.fromAccessToken('token-reply-message-errors');

        await expect(
            client.replyToChatMessage('message-chat-id-placeholder', '   ', { content: 'Hallo' }),
        ).rejects.toThrow('replyUuid is required.');
    });

    it('deletes a chat message', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-delete-message',
            },
        })
            .delete(
                '/v1/channels/chats/message-chat-id-placeholder/messages/message-uuid-placeholder',
            )
            .reply(200, {
                data: null,
                status: 'SUCCESS',
                meta: {
                    warnings: [],
                    errors: [],
                    success: [],
                },
            });

        const client = SduiClient.fromAccessToken('token-delete-message');
        const result = await client.deleteChatMessage<{
            data: null;
            status: string;
            meta: {
                warnings: unknown[];
                errors: unknown[];
                success: unknown[];
            };
        }>('message-chat-id-placeholder', 'message-uuid-placeholder');

        expect(result).toEqual({
            data: null,
            status: 'SUCCESS',
            meta: {
                warnings: [],
                errors: [],
                success: [],
            },
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects missing chat id for deleteChatMessage', async () => {
        const client = SduiClient.fromAccessToken('token-delete-message-errors');

        await expect(
            client.deleteChatMessage('   ', 'message-uuid-placeholder'),
        ).rejects.toThrow('chatId is required.');
    });

    it('rejects missing message uuid for deleteChatMessage', async () => {
        const client = SduiClient.fromAccessToken('token-delete-message-errors');

        await expect(client.deleteChatMessage('message-chat-id-placeholder', '   ')).rejects.toThrow(
            'messageUuid is required.',
        );
    });

    it('fetches channel users', async () => {
        const scope = nock('https://api.sdui.app', {
            reqheaders: {
                authorization: 'Bearer token-channel-users',
            },
        })
            .get('/v1/channels/channel-id-placeholder/users')
            .reply(200, {
                data: [{ id: 'user-1' }],
            });

        const client = SduiClient.fromAccessToken('token-channel-users');
        const result = await client.getChannelUsers<{
            data: Array<{ id: string }>;
        }>('channel-id-placeholder');

        expect(result).toEqual({
            data: [{ id: 'user-1' }],
        });
        expect(scope.isDone()).toBe(true);
    });

    it('rejects missing channel id for channel users', async () => {
        const client = SduiClient.fromAccessToken('token-channel-users-errors');

        await expect(client.getChannelUsers('   ')).rejects.toThrow(
            'channelId is required.',
        );
    });

    it('rejects invalid limit values for user chats', async () => {
        const client = SduiClient.fromAccessToken('token-chats-errors');

        await expect(
            client.getUserChats('user-id-placeholder', { limit: 0 }),
        ).rejects.toThrow('limit must be a positive integer.');
    });
});
