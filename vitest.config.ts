import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'expo-crypto': path.resolve(__dirname, '__mocks__/expo-crypto.ts'),
      'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
    },
  },
  test: {
    hookTimeout: 30000,
    testTimeout: 15000,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'patient-app'],
  },
});