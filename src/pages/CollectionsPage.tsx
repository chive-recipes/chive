import { LayoutGrid } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { fetchCollections } from '../lib/api';
import type { CollectionEnvelope } from '../lib/api';
import { CollectionCard } from '../components/CollectionCard';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useDocumentMetadata({
    title: "Collections",
    description: "Curated recipe groups organized by theme, cuisine, and occasion. Dive into a collection to discover something new."
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchCollections();
        setCollections(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      <header class="mb-12">
        <h1 class="text-4xl md:text-5xl font-sharp mb-4 leading-tight tracking-tighter text-slate-800 flex items-center gap-4">
          <div class="w-12 h-12 bg-mint border-2 border-emerald rounded-2xl flex items-center justify-center shrink-0">
            <LayoutGrid class="text-emerald w-7 h-7" />
          </div>
          Collections
        </h1>
        <p class="text-lg text-slate-500 max-w-2xl leading-relaxed font-medium m-0">
          Curated recipe groups organized by theme, cuisine, and occasion. Dive into a collection to discover something new.
        </p>
      </header>

      {error ? (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Error loading collections: {error}
        </div>
      ) : loading ? (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} class="animate-pulse">
              <div class="bg-mint/50 rounded-2xl md:rounded-3xl border-2 border-mint h-72" />
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div class="text-center py-24 bg-white rounded-[2rem] border-2 border-slate-200 border-dashed flex flex-col items-center">
          <div class="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <LayoutGrid class="w-8 h-8 text-slate-300" />
          </div>
          <h2 class="text-2xl font-sharp text-slate-700 mb-2">No collections yet</h2>
          <p class="text-slate-500 max-w-sm">
            Recipe collections are coming soon. Check back later for curated groups of recipes organized by theme.
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {collections.map(c => (
            <CollectionCard key={c.uri} collection={c} />
          ))}
        </div>
      )}
    </main>
  );
}
