import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useBookmarks, BOOKMARKS_KEY } from '../useBookmarks';
import { useAuth } from '../useAuth';
import * as auth from '../../lib/auth';
import * as bookmarksApi from '../../lib/bookmarks';

// Mock dependencies
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  getCurrentDid: vi.fn(),
  getSessionFetchHandler: vi.fn(),
}));

vi.mock('../../lib/bookmarks', () => ({
  fetchCloudBookmarks: vi.fn(),
  createCloudBookmark: vi.fn(),
  deleteCloudBookmark: vi.fn(),
}));

describe('useBookmarks', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('loads local bookmarks when user is not authenticated', () => {
    // Setup mock auth state (not authenticated)
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });

    const localRecipe = { uri: 'at://local', cid: 'cid', title: 'Local Recipe' };
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([localRecipe]));
    
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarks).toEqual([localRecipe]);
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches cloud bookmarks when user is authenticated', async () => {
    // Setup mock auth state (authenticated)
    vi.mocked(useAuth).mockReturnValue({
      user: { did: 'did:plc:test', handle: 'test.bsky.social' },
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(auth.getCurrentDid).mockReturnValue('did:plc:test');
    vi.mocked(auth.getSessionFetchHandler).mockReturnValue(vi.fn() as any);


    // Mock cloud API response
    const cloudLike = {
      uri: 'at://like1',
      cid: 'cid1',
      value: {
        $type: 'app.bsky.feed.like' as const,
        subject: { uri: 'at://recipe1', cid: 'rcid1' },
        createdAt: '2023-01-01T00:00:00Z',
      }
    };
    vi.mocked(bookmarksApi.fetchCloudBookmarks).mockResolvedValue([cloudLike]);

    renderHook(() => useBookmarks());

    // Wait for effect to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Since the hook calls fetchRecipesByUris, we'd need to mock that too for full data.
    // For now, we can just verify it attempted to fetch cloud bookmarks
    expect(bookmarksApi.fetchCloudBookmarks).toHaveBeenCalledWith('did:plc:test', expect.any(Function));
  });
});
