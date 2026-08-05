import { Bookmark, Compass } from 'lucide-preact';
import { useBookmarks } from '../hooks/useBookmarks';
import { RecipeGrid } from '../components/RecipeGrid';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ButtonLink } from '../components/ui/Button';

export function BookmarksPage() {
  const { bookmarks, isLoading } = useBookmarks();
  useDocumentMetadata({
    title: "Saved Recipes",
    description: "Your personal collection of favorite recipes from the decentralized network, saved locally for easy access."
  });

  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      <PageHeader
        title="Saved Recipes"
        description="Your personal collection of favorite recipes from the decentralized network."
        icon={<Bookmark class="w-6 h-6 fill-current" />}
      />

      {isLoading ? (
        <div class="text-center py-24 flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mb-4" />
          <h2 class="text-xl font-sharp text-slate-600">Loading your saved recipes...</h2>
        </div>
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={<Bookmark class="w-8 h-8" />}
          title="No saved recipes yet"
          description="When you find a recipe you love, click the save button to add it to your personal collection here."
          action={
            <ButtonLink href="/explore" variant="primary">
              <Compass class="w-5 h-5" /> EXPLORE RECIPES
            </ButtonLink>
          }
        />
      ) : (
        <RecipeGrid recipes={bookmarks} />
      )}
    </main>
  );
}
