import '@testing-library/jest-dom/vitest';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/preact';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});
