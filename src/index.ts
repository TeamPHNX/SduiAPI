export { authenticateWithWebUntis } from './auth/webUntisAuth.js';
export { SduiClient } from './client.js';
export { SduiAuthError } from './errors.js';

export type {
    AuthenticateWithWebUntisOptions,
    AuthLogEvent,
    AuthLogger,
    GetChatMessagesOptions,
    GetMessageReadersOptions,
    GetUserChatsOptions,
    GetUserNewsOptions,
    MarkChatAsReadPayload,
    SendChatMessagePayload,
    SduiAuthResult,
    WebUntisCredentials,
} from './types.js';
