import { useEffect, useState } from 'preact/hooks';
import { RecipeCard } from './RecipeCard';
import { fetchRecipes, fetchCollectionBySlug, fetchRecipe } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';

export function HeroAnimation() {
  const [recipes, setRecipes] = useState<RecordEnvelope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch the "easy-weeknight" collection to avoid repeating trending recipes
        const collectionData = await fetchCollectionBySlug('easy-weeknight');
        const rkeys = collectionData.value.recipes.map(r => r.rkey).slice(0, 16);
        
        const results: (RecordEnvelope | null)[] = new Array(rkeys.length).fill(null);
        const promises = rkeys.map(async (rkey, idx) => {
          try {
            const recipe = await fetchRecipe(rkey);
            results[idx] = recipe;
          } catch (e) {
            console.error(`Failed to fetch recipe ${rkey} for hero:`, e);
          }
        });
        
        await Promise.allSettled(promises);
        const activeResults = results.filter((r): r is RecordEnvelope => r !== null);
        
        if (activeResults.length > 0) {
          setRecipes(activeResults);
          return;
        }
        
        throw new Error("No recipes successfully loaded from collection");
      } catch (e) {
        console.warn("Failed to fetch easy-weeknight for hero, falling back to trending:", e);
        try {
          const { records } = await fetchRecipes(30);
          const completeRecords = records.filter(r =>
            r.value.times?.total &&
            r.value.tags &&
            r.value.tags.length > 0
          );
          setRecipes(completeRecords.slice(0, 16));
        } catch (fallbackError) {
          console.error("Hero fallback failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const col1Base = recipes.slice(0, 8);
  const col2Base = recipes.slice(8, 16);

  // Helper to render a group of cards to ensure the flex gap parity is maintained perfectly
  const renderGroup = (colBase: RecordEnvelope[], isLcp: boolean = false) => (
    <div class="flex flex-col gap-6">
      {colBase.map((recipe, i) => (
        <div key={i} class="w-full shrink-0">
          <RecipeCard recipeEnvelope={recipe} variant="compact" isLcp={isLcp} />
        </div>
      ))}
    </div>
  );

  return (
    <div class="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-[2rem] flex justify-center items-center perspective-[1200px] pointer-events-none select-none">
      
      {/* 3D Rotated Container - Fixed size wrapper to avoid centering issues with infinite elements */}
      <div class={`absolute w-[120%] h-[120%] flex justify-center gap-6 transform [transform:rotateX(25deg)_rotateY(-15deg)_rotateZ(10deg)_scale(0.95)] md:[transform:rotateX(25deg)_rotateY(-20deg)_rotateZ(15deg)_scale(1.0)] transition-opacity duration-1000 ease-out ${loading ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Column 1 (Scrolls Up) */}
        {/* We apply stagger to the static wrapper, so the inner animation height math isn't broken */}
        <div class="relative w-48 md:w-60 shrink-0 h-full mt-12">
          <div class="absolute top-0 left-0 w-full flex flex-col gap-6 animate-hero-scroll-up">
            {renderGroup(col1Base, true)}
            {renderGroup(col1Base)}
          </div>
        </div>

        {/* Column 2 (Scrolls Down) */}
        <div class="relative w-48 md:w-60 shrink-0 h-full -mt-24">
          <div class="absolute top-0 left-0 w-full flex flex-col gap-6 animate-hero-scroll-down">
            {renderGroup(col2Base, true)}
            {renderGroup(col2Base)}
          </div>
        </div>

      </div>

      {/* Fade Overlays for seamless entry/exit */}
      <div class="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-paper to-transparent z-20 pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-paper to-transparent z-20 pointer-events-none"></div>
      <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-paper to-transparent z-20 pointer-events-none"></div>
      <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-paper to-transparent z-20 pointer-events-none"></div>
    </div>
  );
}
