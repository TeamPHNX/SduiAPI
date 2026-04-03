# SduiAPI

TypeScript SDUI API client with WebUntis login support.

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
