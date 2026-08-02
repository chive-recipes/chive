import { useState, useEffect } from 'preact/hooks';
import type { AuthUser } from '../lib/auth';

const profileCache = new Map<string, AuthUser | null>();
const pendingFetches = new Map<string, Promise<AuthUser | null>>();

export async function fetchPublicProfile(identifier: string): Promise<AuthUser | null> {
  if (!identifier) return null;
  
  const normalizedId = identifier.replace(/^@/, '');

  if (profileCache.has(normalizedId)) {
    return profileCache.get(normalizedId)!;
  }

  if (pendingFetches.has(normalizedId)) {
    return pendingFetches.get(normalizedId)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(normalizedId)}`
      );
      if (!res.ok) {
        profileCache.set(normalizedId, null);
        return null;
      }
      const data = await res.json();
      const profile: AuthUser = {
        did: data.did,
        handle: data.handle || normalizedId,
        displayName: data.displayName || undefined,
        avatar: data.avatar || undefined,
      };
      profileCache.set(normalizedId, profile);
      // also cache by DID if we fetched by handle, and vice versa
      if (data.did !== normalizedId) {
        profileCache.set(data.did, profile);
      }
      return profile;
    } catch (e) {
      console.error('Failed to fetch profile for', normalizedId, e);
      profileCache.set(normalizedId, null);
      return null;
    } finally {
      pendingFetches.delete(normalizedId);
    }
  })();

  pendingFetches.set(normalizedId, promise);
  return promise;
}

/** Clear in-memory profile cache (primarily for tests) */
export function clearProfileCache(): void {
  profileCache.clear();
  pendingFetches.clear();
}

export function useProfile(identifier: string | null): {
  profile: AuthUser | null;
  isLoading: boolean;
  isNotFound: boolean;
} {
  const normalizedId = identifier ? identifier.replace(/^@/, '') : null;

  const [profile, setProfile] = useState<AuthUser | null>(() => (normalizedId ? profileCache.get(normalizedId) || null : null));
  const [isLoading, setIsLoading] = useState<boolean>(() => (normalizedId ? !profileCache.has(normalizedId) : false));
  const [isNotFound, setIsNotFound] = useState<boolean>(() =>
    normalizedId && profileCache.has(normalizedId) ? profileCache.get(normalizedId) === null : false
  );

  useEffect(() => {
    if (!normalizedId) {
      setProfile(null);
      setIsLoading(false);
      setIsNotFound(Boolean(identifier));
      return;
    }

    if (profileCache.has(normalizedId)) {
      const cached = profileCache.get(normalizedId)!;
      setProfile(cached);
      setIsLoading(false);
      setIsNotFound(cached === null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setIsNotFound(false);

    fetchPublicProfile(normalizedId).then((res) => {
      if (isMounted) {
        setProfile(res);
        setIsLoading(false);
        setIsNotFound(res === null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [normalizedId, identifier]);

  return { profile, isLoading, isNotFound };
}
