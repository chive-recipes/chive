import { useEffect, useState } from 'preact/hooks';
import { fetchRecipe, imageUrl, resolveHandle, extractDid } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';
import { RecipePage } from '../components/RecipePage';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import { useRecipeSchema } from '../hooks/useRecipeSchema';

interface RecipeDetailPageProps {
  rkey?: string; // provided by router
  author?: string;  // provided by router (optional), can be handle or did
}

export function RecipeDetailPage({ rkey, author }: RecipeDetailPageProps) {
  const [envelope, setEnvelope] = useState<RecordEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recipe = envelope?.value;
  const did = envelope ? extractDid(envelope.uri) : undefined;
  const heroUrl = recipe?.image?.ref?.$link ? imageUrl(recipe.image.ref.$link, "fullsize", did) : undefined;

  useDocumentMetadata({
    title: recipe?.name,
    description: recipe?.description,
    image: heroUrl
  });

  useRecipeSchema(recipe, envelope?.uri);
  
  useEffect(() => {
    async function load() {
      if (!rkey) return;
      try {
        setLoading(true);
        let targetDid = author;
        if (author && !author.startsWith('did:')) {
          targetDid = await resolveHandle(author);
        }
        const data = await fetchRecipe(rkey, targetDid);
        setEnvelope(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rkey, author]);

  if (error) {
    return (
      <div class="max-w-4xl mx-auto p-8 animate-slide-up w-full">
        <a href="/" class="text-emerald font-tech mb-4 block">← Back to Feed</a>
        <div class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Error loading recipe: {error}
        </div>
      </div>
    );
  }

  if (loading || !envelope) {
    return (
      <main class="max-w-6xl mx-auto p-4 md:p-8 animate-pulse w-full">
        {/* Top Bar Skeleton */}
        <div class="flex justify-between items-center mb-10">
          <div class="h-6 w-16 bg-mint/50 rounded" />
          <div class="flex gap-3">
            <div class="h-12 w-12 bg-mint/50 rounded-xl" />
            <div class="h-12 w-32 bg-mint/50 rounded-xl" />
          </div>
        </div>

        {/* Hero Image Skeleton */}
        <div class="w-full h-[300px] md:h-[500px] bg-mint/50 border-2 border-mint rounded-[2rem] mb-12 shrink-0" />

        <div class="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Left Column */}
          <div class="flex-[1.5] w-full">
            <div class="h-16 md:h-24 bg-mint/50 rounded-2xl w-3/4 mb-6" />
            <div class="h-6 bg-mint/50 rounded-md w-full mb-2" />
            <div class="h-6 bg-mint/50 rounded-md w-5/6 mb-10" />

            <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-16">
              {[1, 2, 3].map(i => (
                <div key={i} class="bg-mint/30 h-24 rounded-2xl border-2 border-mint/50" />
              ))}
            </div>

            <div class="h-10 bg-mint/50 rounded-xl w-48 mb-8" />
            
            <div class="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} class="flex gap-6 items-start">
                  <div class="w-10 h-10 bg-mint/50 rounded-full shrink-0" />
                  <div class="flex-1 space-y-3 pt-2">
                    <div class="h-4 bg-mint/50 rounded-sm w-full" />
                    <div class="h-4 bg-mint/50 rounded-sm w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (Desktop Only) */}
          <div class="hidden lg:flex flex-1 w-full flex-col gap-10">
            <div class="h-96 bg-mint/30 rounded-3xl border-2 border-mint/50" />
            <div class="h-64 bg-mint/30 rounded-3xl border-2 border-mint/50" />
          </div>
        </div>
      </main>
    );
  }

  return <RecipePage recipeEnvelope={envelope} />;
}
