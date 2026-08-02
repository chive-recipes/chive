import type { RecordEnvelope } from '../lib/api';
import { RecipeCard } from './RecipeCard';
import { SkeletonCard } from './LoadingState';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface RecipeGridProps {
  recipes: RecordEnvelope[];
  loading?: boolean;
  expectedCount?: number;
}

export function RecipeGrid({ recipes, loading = false, expectedCount = 0 }: RecipeGridProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (recipes.length === 0 && !loading) {
    return (
      <div class="py-24 text-center text-slate-500 font-tech">
        No recipes found.
      </div>
    );
  }

  // Calculate how many skeletons we need to render to reach expectedCount
  const skeletonCount = loading ? Math.max(0, expectedCount - recipes.length) : 0;
  const skeletons = Array.from({ length: skeletonCount }, (_, i) => i);

  return (
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
      {recipes.map((envelope, idx) => (
        <div 
          key={envelope.uri} 
          class="animate-card-fade-in"
          style={{ animationDelay: `${(idx % 8) * 50}ms` }}
        >
          <RecipeCard 
            recipeEnvelope={envelope} 
            variant={isMobile ? 'compact' : 'default'}
            isLcp={idx < 2}
          />
        </div>
      ))}
      
      {skeletons.map((i) => (
        <div key={`skeleton-${i}`}>
          <SkeletonCard variant={isMobile ? 'compact' : 'default'} />
        </div>
      ))}
    </div>
  );
}
