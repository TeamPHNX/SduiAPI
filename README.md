# SduiAPI

TypeScript SDUI API client with WebUntis login support.

DISCLAIMER: An independent, open-source project – not connected to or supported by WebUntis, Untis GmbH or Sdui GmbH.

## Install

```bash
npm install sduiapi
```

## Quick Start

```ts
import { SduiClient } from 'sduiapi';

const client = await SduiClient.authenticateWithWebUntis({
    schoolSlink: 'example-school',
    username: process.env.SDUI_USERNAME ?? '',
    password: process.env.SDUI_PASSWORD ?? '',
});

const me = await client.getCurrentUser();
console.log(me);
```

## Public API

### `SduiClient.authenticateWithWebUntis(credentials, options?)`

Creates an authenticated client by running the full SDUI <-> WebUntis bridge flow.

### `SduiClient.fromAccessToken(accessToken)`

Creates a client when you already have a bearer token.

### `client.request(config)`

Sends any request to the SDUI API using the authenticated HTTP instance.

### `client.getCurrentUser()`

Convenience helper for `GET /v1/users/self`.

### `client.getUserNews(userId, options?)`

Convenience helper for `GET /v1/users/:userId/feed/news`.

```ts
const news = await client.getUserNews('user-id-placeholder', {
    page: 2,
    search: 'announcement',
});
```

Options:

- `page` (default: `1`)
- `search` (default: `''`)

### `client.getUserChats(userId, options?)`

Convenience helper for `GET /v1/users/:userId/channels/chats`.

```ts
const chats = await client.getUserChats('user-id-placeholder', {
    page: 2,
    search: '',
    limit: 10,
});
```

Options:

- `page` (default: `1`)
- `search` (default: `''`)
- `limit` (default: `10`)

### `client.getChatMessages(chatId, options?)`

Convenience helper for `GET /v1/channels/chats/:chatId/messages`.

```ts
const messages = await client.getChatMessages('chat-id-placeholder', {
    page: 1,
});
```

Options:

- `page` (default: `1`)

### `client.getMessageReaders(chatId, messageUuid, options?)`

Convenience helper for `GET /v1/channels/chats/:chatId/messages/:messageUuid/readers`.

```ts
const readers = await client.getMessageReaders(
    'readers-chat-id-placeholder',
    'readers-message-uuid-placeholder',
    {
        page: 1,
        search: '',
    },
);
```

Options:

- `page` (default: `1`)
- `search` (default: `''`)

### `client.markChatAsRead(chatId, payload?)`

Convenience helper for `POST /v1/channels/chats/:chatId/read`.

```ts
const result = await client.markChatAsRead('read-chat-id-placeholder', {});
```

`payload` defaults to `{}` and is forwarded as JSON body.

### `client.sendChatMessage(chatId, payload)`

Convenience helper for `POST /v1/channels/chats/:chatId/messages`.

```ts
const sent = await client.sendChatMessage('message-chat-id-placeholder', {
    content: '.',
});
```

`payload.content` is required.
The payload is sent as `multipart/form-data`, and extra payload keys are forwarded as additional form fields.

### `client.replyToChatMessage(chatId, replyUuid, payload)`

Convenience helper for replying via `POST /v1/channels/chats/:chatId/messages` with `reply_uuid`.

```ts
const sentReply = await client.replyToChatMessage(
    'message-chat-id-placeholder',
    'message-uuid-placeholder',
    {
        content: 'Hallo',
    },
);
```

### `client.deleteChatMessage(chatId, messageUuid)`

Convenience helper for `DELETE /v1/channels/chats/:chatId/messages/:messageUuid`.

```ts
const result = await client.deleteChatMessage(
    'message-chat-id-placeholder',
    'message-uuid-placeholder',
);
```

### `client.getChannelUsers(channelId)`

Convenience helper for `GET /v1/channels/:channelId/users`.

```ts
const users = await client.getChannelUsers('channel-id-placeholder');
```

### `authenticateWithWebUntis(credentials, options?)`

Lower-level function that returns:

```ts
{
    accessToken: string;
    http: AxiosInstance;
}
```

## Error Handling

Authentication failures throw `SduiAuthError` with an optional `context` object for debugging.

```ts
import { SduiAuthError, SduiClient } from 'sduiapi';

try {
    await SduiClient.authenticateWithWebUntis({
        schoolSlink: 'example-school',
        username: '...',
        password: '...',
    });
} catch (error) {
    if (error instanceof SduiAuthError) {
        console.error(error.message, error.context);
    }
}
```

## Logging

Pass `logger` in options to get structured auth progress events.

```ts
import { SduiClient } from 'sduiapi';

await SduiClient.authenticateWithWebUntis(
    {
        schoolSlink: 'example-school',
        username: '...',
        password: '...',
    },
    {
        logger: (event) => {
            console.log(
                `[${event.step}] ${event.message}`,
                event.details ?? {},
            );
        },
    },
);
```

## Testing

```bash
npm test
```

The tests use mocked HTTP responses, so they do not call SDUI or WebUntis servers.

### Live SDUI integration test (optional)

Create a local .env file (you can copy .env.example):

SDUI_LIVE_TEST=true
SDUI_SCHOOL_SLINK=example-school
SDUI_USERNAME=your_webuntis_username
SDUI_PASSWORD=your_webuntis_password

Run the real integration test:

```bash
npm run test:live
```

If SDUI_LIVE_TEST is false, or credentials are missing, the live authentication test is skipped.
