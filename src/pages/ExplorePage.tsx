import { Compass } from 'lucide-preact';
import { RecipeDiscovery } from '../components/RecipeDiscovery';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';
import { PageHeader } from '../components/ui/PageHeader';

export function ExplorePage(props: { q?: string }) {
  useDocumentMetadata({
    title: "Explore Recipes",
    description: "Discover culinary inspiration from our decentralized network. Search by ingredients, tags, or recipe names on Chive."
  });
  return (
    <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up w-full">
      <PageHeader
        title="Explore Recipes"
        description="Discover culinary inspiration from our decentralized network. Search by ingredients, tags, or recipe names."
        icon={<Compass class="w-7 h-7" />}
      />
      <RecipeDiscovery showTrendingSeparator={false} externalSearchQuery={props.q || ''} hideSearchBar={false} />
    </main>
  );
}
