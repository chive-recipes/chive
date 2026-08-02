import { Bookmark, Compass } from 'lucide-preact';
import { useBookmarks } from '../hooks/useBookmarks';
import { RecipeGrid } from '../components/RecipeGrid';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export function BookmarksPage() {
  const { bookmarks, isLoading } = useBookmarks();
  useDocumentMetadata({
    title: "Saved Recipes",
    description: "Your personal collection of favorite recipes from the decentralized network, saved locally for easy access."
  });

  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      <header class="mb-12">
        <h1 class="text-4xl md:text-5xl font-sharp mb-4 leading-tight tracking-tighter text-slate-800 flex items-center gap-4">
          <div class="w-12 h-12 bg-mint border-2 border-emerald rounded-2xl flex items-center justify-center shrink-0">
            <Bookmark class="text-emerald w-6 h-6 fill-current" />
          </div>
          Saved Recipes
        </h1>
        <p class="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium m-0">
          Your personal collection of favorite recipes from the decentralized network.
        </p>
      </header>

      {isLoading ? (
        <div class="text-center py-24 flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mb-4" />
          <h2 class="text-xl font-sharp text-slate-600">Loading your saved recipes...</h2>
        </div>
      ) : bookmarks.length === 0 ? (
        <div class="text-center py-24 bg-white rounded-[2rem] border-2 border-slate-200 border-dashed flex flex-col items-center">
          <div class="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Bookmark class="w-8 h-8 text-slate-300" />
          </div>
          <h2 class="text-2xl font-sharp text-slate-700 mb-2">No saved recipes yet</h2>
          <p class="text-slate-500 mb-8 max-w-sm">
            When you find a recipe you love, click the save button to add it to your personal collection here.
          </p>
          <a href="/explore" class="inline-flex items-center gap-2 bg-emerald text-white px-6 py-3 rounded-xl font-brand sh-standard hover:-translate-y-[1px] hover:shadow-none transition-all cursor-pointer no-underline">
            <Compass class="w-5 h-5" /> EXPLORE RECIPES
          </a>
        </div>
      ) : (
        <RecipeGrid recipes={bookmarks} />
      )}
    </main>
  );
}
