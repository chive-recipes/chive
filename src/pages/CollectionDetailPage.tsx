import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, ChefHat } from 'lucide-preact';
import { fetchCollectionBySlug, fetchRecipe } from '../lib/api';
import type { CollectionEnvelope, RecordEnvelope } from '../lib/api';
import { RecipeGrid } from '../components/RecipeGrid';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

interface CollectionDetailPageProps {
  slug?: string;
}

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const [collection, setCollection] = useState<CollectionEnvelope | null>(null);
  const [recipes, setRecipes] = useState<RecordEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const collectionVal = collection?.value;
  useDocumentMetadata({
    title: collectionVal ? `${collectionVal.emoji} ${collectionVal.name}` : undefined,
    description: collectionVal?.description
  });

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        setLoading(true);
        setRecipesLoading(true);
        
        // Fetch the collection record
        const collectionData = await fetchCollectionBySlug(slug);
        setCollection(collectionData);
        setLoading(false);

        // Fetch all referenced recipes in parallel
        const rkeys = collectionData.value.recipes.map(r => r.rkey);
        const results: (RecordEnvelope | null)[] = new Array(rkeys.length).fill(null);

        const promises = rkeys.map(async (rkey, idx) => {
          try {
            const recipe = await fetchRecipe(rkey);
            results[idx] = recipe;
            // Update progressively
            setRecipes(results.filter((r): r is RecordEnvelope => r !== null));
          } catch (e) {
            console.error(`Failed to fetch recipe ${rkey}:`, e);
          }
        });

        await Promise.allSettled(promises);
        setRecipes(results.filter((r): r is RecordEnvelope => r !== null));
      } catch (e) {
        setError(String(e));
        setLoading(false);
      } finally {
        setRecipesLoading(false);
      }
    }
    load();
  }, [slug]);

  if (error) {
    return (
      <div class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
        <a href="/collections" class="text-emerald font-tech mb-4 block no-underline hover:underline">
          ← Back to Collections
        </a>
        <div class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Error loading collection: {error}
        </div>
      </div>
    );
  }

  if (loading || !collection) {
    return (
      <main class="max-w-6xl mx-auto p-4 md:p-8 animate-pulse w-full">
        <div class="h-6 w-40 bg-mint/50 rounded mb-8" />
        <div class="bg-mint/30 rounded-3xl p-8 md:p-12 mb-12">
          <div class="h-16 w-16 bg-mint/50 rounded-2xl mb-6" />
          <div class="h-10 w-3/4 bg-mint/50 rounded-2xl mb-4" />
          <div class="h-6 w-1/2 bg-mint/50 rounded-xl" />
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} class="h-64 bg-mint/30 rounded-2xl border-2 border-mint/50" />
          ))}
        </div>
      </main>
    );
  }

  const c = collection.value;
  const recipeCount = c.recipes.length;

  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      {/* Back link */}
      <a
        href="/collections"
        class="inline-flex items-center gap-2 text-emerald font-tech text-sm mb-8 no-underline hover:underline group"
      >
        <ArrowLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Collections
      </a>

      {/* Collection Header */}
      <header class="bg-gradient-to-br from-mint via-mint/55 to-emerald/5 rounded-3xl p-6 md:p-8 mb-8 border border-emerald/10 relative overflow-hidden">
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-sharp mb-3 leading-tight tracking-tighter text-slate-800 m-0 flex items-center gap-3">
          <span class="select-none text-4xl md:text-5xl lg:text-6xl shrink-0">{c.emoji}</span>
          <span>{c.name}</span>
        </h1>
        {c.description && (
          <p class="text-base md:text-lg text-slate-500 max-w-3xl leading-relaxed font-medium m-0 mb-4">
            {c.description}
          </p>
        )}
        <div class="flex items-center gap-2 text-sm font-tech text-emerald">
          <ChefHat class="w-4 h-4" />
          <span>{recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}</span>
        </div>
      </header>

      {/* Recipe Grid */}
      <RecipeGrid
        recipes={recipes}
        loading={recipesLoading}
        expectedCount={recipeCount}
      />
    </main>
  );
}
