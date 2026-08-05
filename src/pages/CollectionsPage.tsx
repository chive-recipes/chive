import { LayoutGrid } from 'lucide-preact';
import { useEffect, useState } from 'preact/hooks';
import { fetchCollections } from '../lib/api';
import type { CollectionEnvelope } from '../lib/api';
import { CollectionCard } from '../components/CollectionCard';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

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
      <PageHeader
        title="Collections"
        description="Curated recipe groups organized by theme, cuisine, and occasion. Dive into a collection to discover something new."
        icon={<LayoutGrid class="w-7 h-7" />}
      />

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
        <EmptyState
          icon={<LayoutGrid class="w-8 h-8" />}
          title="No collections yet"
          description="Recipe collections are coming soon. Check back later for curated groups of recipes organized by theme."
        />
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
