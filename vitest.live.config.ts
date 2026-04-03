import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.live.test.ts'],
        setupFiles: ['test/live.setup.ts'],
        testTimeout: 120000,
        hookTimeout: 120000,
    },
});
