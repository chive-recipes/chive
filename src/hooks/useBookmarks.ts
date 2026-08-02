import { useState, useEffect, useCallback } from 'preact/hooks';
import { useAuth } from './useAuth';
import { fetchRecipesByUris, type RecordEnvelope } from '../lib/api';
import { fetchCloudBookmarks, createCloudBookmark, deleteCloudBookmark } from '../lib/bookmarks';
import { getSessionFetchHandler, getCurrentDid } from '../lib/auth';

export const BOOKMARKS_KEY = 'chive_bookmarks';

function getStoredBookmarks(): RecordEnvelope[] {
  try {
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse bookmarks from localStorage', e);
    return [];
  }
}

export function useBookmarks() {
  const { user } = useAuth();
  
  // The actual recipe data for display
  const [bookmarks, setBookmarks] = useState<RecordEnvelope[]>(getStoredBookmarks());
  
  // A mapping of recipeUri -> bookmarkUri (for cloud deletion)
  const [cloudMapping, setCloudMapping] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(false);

  // Sync state based on auth status
  useEffect(() => {
    let active = true;

    async function syncCloudBookmarks() {
      const did = getCurrentDid();
      const fetchHandler = getSessionFetchHandler();
      
      if (!did || !fetchHandler) return;

      setIsLoading(true);
      try {
        // 1. Fetch cloud bookmarks
        const cloudRecords = await fetchCloudBookmarks(did, fetchHandler);
        
        // 2. Build mapping and identify missing recipes
        const mapping: Record<string, string> = {};
        const cloudRecipeUris = new Set<string>();
        
        cloudRecords.forEach(record => {
          mapping[record.value.subject.uri] = record.uri;
          cloudRecipeUris.add(record.value.subject.uri);
        });

        // 3. Migrate any local bookmarks that aren't in the cloud yet
        const localBookmarks = getStoredBookmarks();

        for (const local of localBookmarks) {
          if (!cloudRecipeUris.has(local.uri)) {
            // Upload to cloud
            try {
              const newBookmarkUri = await createCloudBookmark(did, local.uri, local.cid, fetchHandler);
              mapping[local.uri] = newBookmarkUri;
              cloudRecipeUris.add(local.uri);
            } catch (err) {
              console.error("Failed to migrate bookmark to cloud:", err);
            }
          }
        }

        // Clear local storage since we've migrated
        if (localBookmarks.length > 0) {
          localStorage.removeItem(BOOKMARKS_KEY);
          window.dispatchEvent(new Event('bookmarks-updated'));
        }

        // 4. Fetch the full RecordEnvelopes for the cloud bookmarks
        // (We need the actual recipe data to render the bookmarks page)
        const urisToFetch = Array.from(cloudRecipeUris);
        // Assuming there are ~3000 recipes max for now, totalCollectionSize is a guess. 
        // fetchRecipesByUris handles the pagination logic anyway.
        const recipes = await fetchRecipesByUris(urisToFetch);

        if (active) {
          setCloudMapping(mapping);
          setBookmarks(recipes);
        }
      } catch (err) {
        console.error("Failed to sync cloud bookmarks:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (user) {
      // User is logged in, sync with cloud
      syncCloudBookmarks();
    } else {
      // User is logged out, rely on local storage
      setBookmarks(getStoredBookmarks());
      setCloudMapping({});
      
      function handleStorageChange() {
        if (active) setBookmarks(getStoredBookmarks());
      }
      window.addEventListener('bookmarks-updated', handleStorageChange);
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('bookmarks-updated', handleStorageChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    }

    return () => {
      active = false;
    };
  }, [user]);

  const addBookmark = async (recipe: RecordEnvelope) => {
    // Optimistic UI update
    const current = [...bookmarks];
    if (!current.some(b => b.uri === recipe.uri)) {
      setBookmarks([...current, recipe]);
    }

    const did = getCurrentDid();
    const fetchHandler = getSessionFetchHandler();

    if (did && fetchHandler) {
      // Cloud mode
      try {
        const bookmarkUri = await createCloudBookmark(did, recipe.uri, recipe.cid, fetchHandler);
        setCloudMapping(prev => ({ ...prev, [recipe.uri]: bookmarkUri }));
      } catch (err) {
        console.error("Failed to add cloud bookmark:", err);
        alert(`Failed to add cloud bookmark: ${err instanceof Error ? err.message : String(err)}`);
        // Revert optimistic update
        setBookmarks(current);
      }
    } else {
      // Local mode
      const stored = getStoredBookmarks();
      if (!stored.some(b => b.uri === recipe.uri)) {
        const next = [...stored, recipe];
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('bookmarks-updated'));
        setBookmarks(next);
      }
    }
  };

  const removeBookmark = async (recipeUri: string) => {
    // Optimistic UI update
    const current = [...bookmarks];
    setBookmarks(current.filter(b => b.uri !== recipeUri));

    const did = getCurrentDid();
    const fetchHandler = getSessionFetchHandler();

    if (did && fetchHandler) {
      // Cloud mode
      const bookmarkUri = cloudMapping[recipeUri];
      if (bookmarkUri) {
        try {
          await deleteCloudBookmark(did, bookmarkUri, fetchHandler);
          setCloudMapping(prev => {
            const next = { ...prev };
            delete next[recipeUri];
            return next;
          });
        } catch (err) {
          console.error("Failed to remove cloud bookmark:", err);
          // Revert optimistic update
          setBookmarks(current);
        }
      }
    } else {
      // Local mode
      const stored = getStoredBookmarks();
      const next = stored.filter(b => b.uri !== recipeUri);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event('bookmarks-updated'));
      setBookmarks(next);
    }
  };

  const toggleBookmark = (recipe: RecordEnvelope) => {
    if (isBookmarked(recipe.uri)) {
      removeBookmark(recipe.uri);
    } else {
      addBookmark(recipe);
    }
  };

  const isBookmarked = useCallback((uri: string) => {
    return bookmarks.some(b => b.uri === uri);
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked
  };
}
