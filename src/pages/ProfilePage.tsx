import { User, Plus, ExternalLink, ChefHat, BookOpen, UserX, Compass } from 'lucide-preact';
import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { fetchRecipes } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';
import { RecipeGrid } from '../components/RecipeGrid';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonLink } from '../components/ui/Button';

interface ProfilePageProps {
  identifier?: string;
}

export function ProfilePage({ identifier }: ProfilePageProps) {
  const { user } = useAuth();
  
  // Target Identifier: from URL prop, or fallback to authenticated user's handle
  const targetIdentifier = identifier || user?.handle || null;
  const isOwnProfile = Boolean(user && (targetIdentifier === user.handle || targetIdentifier === user.did));

  // Fetch public profile if viewing remote profile or signed out
  const { profile: publicProfile, isLoading: isProfileLoading, isNotFound } = useProfile(
    !isOwnProfile && targetIdentifier ? targetIdentifier : null
  );

  const profileUser = isOwnProfile ? user : publicProfile;
  const targetDid = profileUser?.did;

  const [recipes, setRecipes] = useState<RecordEnvelope[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);

  useDocumentMetadata({
    title: profileUser ? `${profileUser.displayName || profileUser.handle}'s Profile` : 'User Profile',
    description: profileUser
      ? `Explore decentralized recipes published by ${profileUser.displayName || `@${profileUser.handle}`} on Chive.`
      : 'User profile on Chive decentralized recipe platform.',
  });

  useEffect(() => {
    if (isNotFound || (!isProfileLoading && !targetDid)) {
      setIsLoadingRecipes(false);
      return;
    }

    if (!targetDid) {
      return;
    }

    let isMounted = true;
    setIsLoadingRecipes(true);

    fetchRecipes(100, undefined, targetDid)
      .then(({ records }) => {
        if (isMounted) {
          setRecipes(records || []);
          setIsLoadingRecipes(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load user recipes:', err);
        if (isMounted) {
          setRecipes([]);
          setIsLoadingRecipes(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetDid, isNotFound, isProfileLoading]);

  if (!targetIdentifier && !user) {
    return (
      <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
        <EmptyState
          icon={<User class="w-8 h-8" />}
          title="Sign in to view your profile"
          description="Sign in with your Bluesky account to manage and view all your published recipes."
          action={
            <ButtonLink href="/login" variant="primary">
              SIGN IN
            </ButtonLink>
          }
        />
      </main>
    );
  }

  // Handle non-existent or invalid identifier
  if (identifier && !isProfileLoading && isNotFound) {
    return (
      <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
        <EmptyState
          icon={<UserX class="w-8 h-8" />}
          title="User Not Found"
          description={
            <span>
              The profile for <code class="bg-mint/60 text-emerald px-2 py-0.5 rounded font-tech text-xs">{identifier}</code> could not be found on the AT Protocol network.
            </span>
          }
          action={
            <ButtonLink href="/explore" variant="primary">
              <Compass class="w-5 h-5" /> EXPLORE RECIPES
            </ButtonLink>
          }
        />
      </main>
    );
  }

  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      {/* Profile Header */}
      <div class="mb-16 pt-4 relative">
        <div class="absolute -top-12 -right-12 w-64 h-64 bg-mint/30 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-5 md:gap-6">
            {profileUser?.avatar ? (
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName || profileUser.handle}
                class="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-emerald/20 shadow-sm shrink-0"
              />
            ) : (
              <div class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-mint/50 border-2 border-emerald/20 flex items-center justify-center shrink-0">
                <User class="w-10 h-10 md:w-12 md:h-12 text-emerald" />
              </div>
            )}

            <div class="flex flex-col">
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-3xl md:text-4xl font-sharp font-bold text-slate-800 tracking-tight m-0">
                  {profileUser?.displayName || (profileUser?.handle ? `@${profileUser.handle}` : 'Chef')}
                </h1>
                {isOwnProfile && (
                  <span class="bg-emerald/10 text-emerald px-2.5 py-0.5 rounded-full text-xs font-tech uppercase font-bold tracking-widest mt-1">
                    You
                  </span>
                )}
              </div>

              {profileUser?.handle && profileUser?.displayName && (
                <div class="flex items-center gap-2 text-slate-500 font-tech text-sm mt-1.5">
                  <span>{`@${profileUser.handle}`}</span>
                  <a
                    href={`https://bsky.app/profile/${profileUser.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-slate-400 hover:text-emerald transition-colors"
                    title="View on Bluesky"
                    aria-label="View profile on Bluesky"
                  >
                    <ExternalLink class="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <ButtonLink href="/create" variant="secondary" size="md" class="shrink-0">
              <Plus class="w-4 h-4" /> POST RECIPE
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Recipes Section */}
      <section>
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b-2 border-slate-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-mint/40 flex items-center justify-center border border-emerald/20 shrink-0">
              <BookOpen class="w-5 h-5 text-emerald" />
            </div>
            <h2 class="text-2xl md:text-3xl font-sharp text-slate-800 m-0 flex items-center gap-3">
              <span>Published Recipes</span>
              {!isLoadingRecipes && (
                <span class="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-lg text-sm font-bold font-tech self-center">
                  {recipes.length}
                </span>
              )}
            </h2>
          </div>
        </div>

        {isLoadingRecipes ? (
          <div class="text-center py-24 flex flex-col items-center">
            <div class="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mb-4" />
            <h3 class="text-lg font-sharp text-slate-600">Loading recipes...</h3>
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={<ChefHat class="w-7 h-7" />}
            title="No recipes published yet"
            description={
              isOwnProfile
                ? 'You have not published any recipes under your DID yet.'
                : `${profileUser?.displayName || 'This user'} has not published any recipes under their DID yet.`
            }
            action={isOwnProfile ? (
              <ButtonLink href="/create" variant="primary">
                <Plus class="w-4 h-4" /> POST YOUR FIRST RECIPE
              </ButtonLink>
            ) : undefined}
          />
        ) : (
          <RecipeGrid recipes={recipes} />
        )}
      </section>
    </main>
  );
}
