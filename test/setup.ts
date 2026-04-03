import nock from 'nock';
import { afterAll, afterEach, beforeAll } from 'vitest';

beforeAll(() => {
    nock.disableNetConnect();
});

afterEach(() => {
    const pending = nock.pendingMocks();
    nock.cleanAll();

    if (pending.length > 0) {
        throw new Error(`Unconsumed HTTP mocks: ${pending.join(', ')}`);
    }
});

afterAll(() => {
    nock.enableNetConnect();
});
