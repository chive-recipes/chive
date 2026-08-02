import { BadgeCheck, User } from 'lucide-preact';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { DID } from '../lib/api';

interface RecipeCreatorBadgeProps {
  /** The AT URI of the recipe, e.g. at://did:plc:.../com.chive.recipe/3k... */
  recipeUri?: string;
  /** Size variant for different container contexts */
  variant?: 'detail' | 'card-body' | 'card-overlay';
}

export function RecipeCreatorBadge({ recipeUri, variant = 'detail' }: RecipeCreatorBadgeProps) {
  const { user } = useAuth();

  // Extract author DID from AT URI if present
  let authorDid: string | null = null;
  if (recipeUri && recipeUri.startsWith('at://')) {
    const parts = recipeUri.replace('at://', '').split('/');
    authorDid = parts[0] || null;
  }

  const isOfficial = !authorDid || authorDid === DID;
  const isSignedUser = user && user.did === authorDid;

  // Fetch public profile if recipe is non-official and current user is not the author (or user is signed out)
  const { profile: fetchedProfile, isLoading } = useProfile(
    !isOfficial && !isSignedUser ? authorDid : null
  );

  const creator = isSignedUser ? user : fetchedProfile;

  if (variant === 'card-body') {
    if (!isOfficial && creator) {
      return (
        <div class="flex items-center gap-2 text-[11px] font-tech text-slate-600 truncate">
          {creator.avatar ? (
            <img
              src={creator.avatar}
              alt={creator.handle}
              class="w-6 h-6 rounded-full object-cover border border-emerald/20 shrink-0 shadow-2xs"
            />
          ) : (
            <div class="w-6 h-6 rounded-full bg-mint border border-emerald/20 flex items-center justify-center shrink-0">
              <User class="w-3.5 h-3.5 text-emerald" />
            </div>
          )}
          <span class="truncate font-medium">@{creator.handle}</span>
        </div>
      );
    }
    if (!isOfficial && isLoading) {
      return (
        <div class="flex items-center gap-2 animate-pulse">
          <div class="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
          <div class="w-20 h-3 bg-slate-200 rounded" />
        </div>
      );
    }
    return null;
  }

  if (variant === 'card-overlay') {
    if (isOfficial) {
      return (
        <div 
          class="flex items-center justify-center drop-shadow-sm" 
          title="Official Verified Recipe"
        >
          <BadgeCheck class="w-6 h-6 text-white" fill="#3b82f6" />
        </div>
      );
    }
    return null;
  }

  // 'detail' variant (for RecipePage)
  if (!isOfficial && creator) {
    return (
      <a
        href={`/profile/${creator.handle}`}
        class="inline-flex items-center gap-2 text-slate-600 hover:text-emerald transition-colors no-underline group w-fit"
      >
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.displayName || creator.handle}
            class="w-7 h-7 rounded-full object-cover border border-emerald/20 shrink-0 shadow-2xs"
          />
        ) : (
          <div class="w-7 h-7 rounded-full bg-mint border border-emerald/20 flex items-center justify-center shrink-0">
            <User class="w-4 h-4 text-emerald" />
          </div>
        )}
        <span class="text-sm font-medium font-tech">
          {creator.displayName || `@${creator.handle}`}
          {creator.displayName && (
            <span class="text-slate-400 font-normal ml-1 font-tech text-xs">
              (@{creator.handle})
            </span>
          )}
        </span>
      </a>
    );
  }

  if (!isOfficial && isLoading) {
    return (
      <div class="inline-flex items-center gap-2 animate-pulse">
        <div class="w-7 h-7 rounded-full bg-slate-200 shrink-0" />
        <div class="w-24 h-3 bg-slate-200 rounded" />
      </div>
    );
  }

  return null;
}
