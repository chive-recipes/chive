import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/preact';
import { useProfile, clearProfileCache } from '../useProfile';

describe('useProfile hook', () => {
  beforeEach(() => {
    clearProfileCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null profile for empty or invalid DIDs', async () => {
    const { result } = renderHook(() => useProfile(null));
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches public profile from Bluesky XRPC endpoint', async () => {
    const mockProfile = {
      did: 'did:plc:test123456789',
      handle: 'testchef.bsky.social',
      displayName: 'Test Chef',
      avatar: 'https://example.com/avatar.jpg',
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProfile,
    } as Response);

    const { result } = renderHook(() => useProfile('did:plc:test123456789'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual({
      did: 'did:plc:test123456789',
      handle: 'testchef.bsky.social',
      displayName: 'Test Chef',
      avatar: 'https://example.com/avatar.jpg',
    });
  });

  it('handles fetch failures gracefully with isNotFound flag', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => useProfile('did:plc:failed123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
    expect(result.current.isNotFound).toBe(true);
  });
});
