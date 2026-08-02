import { Compass } from 'lucide-preact';
import { RecipeDiscovery } from '../components/RecipeDiscovery';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export function ExplorePage(props: { q?: string }) {
  useDocumentMetadata({
    title: "Explore Recipes",
    description: "Discover culinary inspiration from our decentralized network. Search by ingredients, tags, or recipe names on Chive."
  });
  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      <header class="mb-12">
        <h1 class="text-4xl md:text-5xl font-sharp mb-4 leading-tight tracking-tighter text-slate-800 flex items-center gap-4">
          <div class="w-12 h-12 bg-mint border-2 border-emerald rounded-2xl flex items-center justify-center shrink-0">
            <Compass class="text-emerald w-7 h-7" />
          </div>
          Explore Recipes
        </h1>
        <p class="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium m-0">
          Discover culinary inspiration from our decentralized network. Search by ingredients, tags, or recipe names.
        </p>
      </header>
      <RecipeDiscovery showTrendingSeparator={false} externalSearchQuery={props.q || ''} hideSearchBar={false} />
    </main>
  );
}
