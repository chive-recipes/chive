import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractRkey } from '../api';

describe('api utilities', () => {
  describe('extractRkey', () => {
    it('should extract the rkey from a valid AT-URI', () => {
      const uri = 'at://did:plc:xyz/app.bsky.feed.like/3kxyz';
      expect(extractRkey(uri)).toBe('3kxyz');
    });

    it('should return the string itself if there are no slashes', () => {
      const uri = 'not-an-at-uri';
      expect(extractRkey(uri)).toBe('not-an-at-uri');
    });

    it('should handle URIs without a path gracefully', () => {
      const uri = 'at://did:plc:xyz';
      expect(extractRkey(uri)).toBe('did:plc:xyz');
    });
  });

  describe('fetchRecipes', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      vi.resetAllMocks();
    });

    it('should fetch recipes using the default Chive DID if no repo is provided', async () => {
      const mockResponse = { records: [], cursor: 'next' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { fetchRecipes } = await import('../api');
      await fetchRecipes(10);
      
      const fetchCall = (globalThis.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain('repo=did%3Aplc%3A'); // Defaults to the official DID
      expect(fetchCall).toContain('limit=10');
    });

    it('should fetch recipes using the provided user DID', async () => {
      const mockResponse = { records: [], cursor: 'next' };
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { fetchRecipes } = await import('../api');
      await fetchRecipes(100, undefined, 'did:plc:testuser');
      
      const fetchCall = (globalThis.fetch as any).mock.calls[0][0];
      expect(fetchCall).toContain('repo=did%3Aplc%3Atestuser');
    });
  });
});
