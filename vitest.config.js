import { defineConfig } from 'vitest/config';

// Tests run in Node. Rules tests talk to the Firebase emulators and share their
// state, so test files run one at a time (see `npm run test:rules`).
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
