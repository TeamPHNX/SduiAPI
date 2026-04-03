import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.test.ts'],
        exclude: ['test/**/*.live.test.ts'],
        setupFiles: ['test/setup.ts'],
        clearMocks: true,
        restoreMocks: true,
    },
});
