import { Search, Flame, ListFilter } from 'lucide-preact';
import { useEffect, useState, useRef } from 'preact/hooks';
import { route, useRouter } from 'preact-router';
import { fetchRecipes, fetchRecipesByUris, fetchCollectionBySlug, fetchRecipe, filterIndexedRecipeRkeys } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';
import { RecipeGrid } from './RecipeGrid';
import { RecipeCarousel } from './RecipeCarousel';
import { useAuth } from '../hooks/useAuth';

// We'll fetch this from public/index.json
let titleIndexCache: any[] | null = null;
let topCuisinesCache: string[] = [];
let cachedUserDid: string | null = null;

async function getTitleIndex(userDid?: string) {
  // If we have a cache and either no user was provided, or we already merged this user, return it
  if (titleIndexCache && (!userDid || cachedUserDid === userDid)) {
    return { titleIndex: titleIndexCache, topCuisines: topCuisinesCache };
  }
  
  try {
    let indexData: any[] = [];
    
    // Only fetch the global index if we don't have it yet
    if (!titleIndexCache) {
      const res = await fetch('/index.json', { cache: 'no-cache' });
      indexData = await res.json();
    } else {
      indexData = [...titleIndexCache];
    }
    // Fetch and merge user's recipes if authenticated
    if (userDid && cachedUserDid !== userDid) {
      try {
        const { records } = await fetchRecipes(100, undefined, userDid);
        const userIndexItems = records.map(r => ({
          t: r.value.name,
          id: r.uri,
          c: r.value.cuisine?.toLowerCase(),
          g: r.value.tags || []
        }));
        
        // Remove any existing user recipes (deduplication)
        const userUris = new Set(userIndexItems.map(i => i.id));
        indexData = indexData.filter((item: any) => !userUris.has(item.id));
        
        // Prepend user's recipes
        indexData = [...userIndexItems, ...indexData];
        cachedUserDid = userDid;
      } catch (err) {
        console.error("Failed to fetch user recipes for index merging:", err);
      }
    }

    titleIndexCache = indexData;

    const cuisineCounts = titleIndexCache.reduce((acc, item) => {
      if (item.c) {
        acc[item.c] = (acc[item.c] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    topCuisinesCache = (Object.entries(cuisineCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name)
      .sort();
    return { titleIndex: titleIndexCache, topCuisines: topCuisinesCache };
  } catch (e) {
    console.error("Failed to load recipe index", e);
    titleIndexCache = [];
    topCuisinesCache = [];
    return { titleIndex: [], topCuisines: [] };
  }
}
interface RecipeDiscoveryProps {
  showTrendingSeparator?: boolean;
  limit?: number;
  externalSearchQuery?: string;
  hideSearchBar?: boolean;
}
export function RecipeDiscovery({ showTrendingSeparator = false, limit, externalSearchQuery = '', hideSearchBar = false }: RecipeDiscoveryProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<RecordEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topCuisineState, setTopCuisineState] = useState<string[]>(topCuisinesCache);
  const [internalInputText, setInternalInputText] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [stagedCuisines, setStagedCuisines] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [expectedCount, setExpectedCount] = useState(24);
  const filterRef = useRef<HTMLDivElement>(null);
  // Tracks the current search generation to prevent stale async results from overwriting newer searches
  const searchGenRef = useRef(0);
  const shuffledIndexRef = useRef<any[] | null>(null);
  const [{ url }] = useRouter();
  const searchParams = new URLSearchParams(url.split('?')[1] || '');
  const activeQuery = searchParams.get('q') ?? externalSearchQuery ?? '';
  const activeCuisines = searchParams.get('cuisine')?.split(',').filter(Boolean) || [];
  // Reset staged cuisines when popover opens
  useEffect(() => {
    if (isFilterOpen) {
      setStagedCuisines(selectedCuisines);
    }
  }, [isFilterOpen]);
  // Close filter when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    // Increment generation so any in-flight search from a previous render becomes stale
    const gen = ++searchGenRef.current;
    async function load() {
      try {
        setLoading(true);
        const currentCount = limit || visibleCount;
        setExpectedCount(currentCount);
        const { titleIndex, topCuisines } = await getTitleIndex(user?.did);
        if (gen !== searchGenRef.current) return;
        setTopCuisineState(topCuisines);
        if (showTrendingSeparator && !activeQuery && activeCuisines.length === 0) {
          try {
            const collectionData = await fetchCollectionBySlug('trending');
            if (gen !== searchGenRef.current) return;
            const collectionRkeys = collectionData.value.recipes.map(r => r.rkey);
            const rkeys = filterIndexedRecipeRkeys(collectionRkeys, titleIndex);
            const staleReferenceCount = collectionRkeys.length - rkeys.length;
            if (staleReferenceCount > 0) {
              console.warn(
                `Skipped ${staleReferenceCount} stale trending recipe reference${staleReferenceCount === 1 ? '' : 's'}.`,
              );
            }
            setExpectedCount(rkeys.length);
            const results: (RecordEnvelope | null)[] = new Array(rkeys.length).fill(null);

            const promises = rkeys.map(async (rkey, idx) => {
              try {
                const recipe = await fetchRecipe(rkey);
                if (gen !== searchGenRef.current) return;
                results[idx] = recipe;
                // Update progressively to maintain smooth streaming card entries
                setRecipes(results.filter((r): r is RecordEnvelope => r !== null));
              } catch (e) {
                console.error(`Failed to fetch trending recipe ${rkey}:`, e);
              }
            });

            await Promise.allSettled(promises);
            if (gen !== searchGenRef.current) return;
            setRecipes(results.filter((r): r is RecordEnvelope => r !== null));
          } catch (trendingError) {
            if (gen !== searchGenRef.current) return;
            console.error("Failed to load trending collection, falling back to all recipes:", trendingError);
            const { records } = await fetchRecipes(100);
            if (gen !== searchGenRef.current) return;
            // Filter out incomplete records for the trending feed to maintain a premium, scannable UI
            const completeRecords = records.filter(r =>
              r.value.times?.total &&
              r.value.tags &&
              r.value.tags.length > 0
            );
            setRecipes(completeRecords);
          }
        } else {
          const lowerQ = activeQuery.toLowerCase();
          const lowerCuisines = activeCuisines.map(c => c.toLowerCase());
          
          let sourceIndex = titleIndex;
          if (!activeQuery && activeCuisines.length === 0) {
            if (!shuffledIndexRef.current && titleIndex) {
              shuffledIndexRef.current = [...titleIndex].sort(() => Math.random() - 0.5);
            }
            sourceIndex = shuffledIndexRef.current || titleIndex;
          }

          const matches = sourceIndex!.filter((item: any) => {
            if (activeQuery) {
              const matchQ =
                (item.t && item.t.toLowerCase().includes(lowerQ)) ||
                (item.c && item.c.toLowerCase().includes(lowerQ)) ||
                (item.g && item.g.some((g: string) => g.toLowerCase().includes(lowerQ)));
              if (!matchQ) return false;
            }
            if (lowerCuisines.length > 0) {
              if (!item.c || !lowerCuisines.includes(item.c.toLowerCase())) return false;
            }
            return true;
          });
          if (gen !== searchGenRef.current) return;
          if (matches.length === 0) {
            setExpectedCount(0);
            setRecipes([]);
          } else {
            // Set dynamic expected count based on matches, capped at the max displayed count
            setExpectedCount(Math.min(currentCount, matches.length));
            const uris = matches.slice(0, currentCount).map((m: any) => m.id);
            // Stream results as they come in to improve perceived performance
            const fullRecords = await fetchRecipesByUris(
              uris,
              (partial) => {
                if (gen !== searchGenRef.current) return;
                setRecipes(partial);
              }
            );
            if (gen !== searchGenRef.current) return;
            setRecipes(fullRecords);
          }
        }
      } catch (e) {
        if (gen !== searchGenRef.current) return;
        setError(String(e));
      } finally {
        if (gen === searchGenRef.current) {
          setLoading(false);
        }
      }
    }
    setVisibleCount(24);
    load();
  }, [activeQuery, url]); // Added url to dependencies to react to cuisine changes
  useEffect(() => {
    // Only autofire if the text or cuisines changed and isn't identical to activeUrl state
    const trimmedInput = internalInputText.trim();
    const sortedSelected = [...selectedCuisines].sort();
    const sortedActive = [...activeCuisines].sort();
    const cuisinesChanged = JSON.stringify(sortedSelected) !== JSON.stringify(sortedActive);
    if (trimmedInput === activeQuery && !cuisinesChanged) return;
    // Minimum 3 characters to trigger auto-search for text, unless clearing the search or changing cuisine
    if (trimmedInput.length > 0 && trimmedInput.length < 3 && !cuisinesChanged) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (trimmedInput) params.set('q', trimmedInput);
      if (selectedCuisines.length > 0) params.set('cuisine', selectedCuisines.join(','));
      route(`/explore?${params.toString()}`, true);
    }, 400); // 400ms debounce delay
    return () => clearTimeout(timeout);
  }, [internalInputText, selectedCuisines, activeQuery]);
  useEffect(() => {
    setInternalInputText(activeQuery);
    setSelectedCuisines(activeCuisines);
  }, [activeQuery, searchParams.get('cuisine')]);
  const isTrendingCarousel = showTrendingSeparator && !activeQuery && activeCuisines.length === 0;
  const displayedCount = isTrendingCarousel ? 12 : (limit || visibleCount);
  const displayedRecipes = recipes.slice(0, displayedCount);
  const hasMore = recipes.length > displayedCount;
  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (internalInputText.trim()) params.set('q', internalInputText.trim());
    setSelectedCuisines(stagedCuisines); // Promote staged to applied
    if (stagedCuisines.length > 0) params.set('cuisine', stagedCuisines.join(','));
    route(`/explore?${params.toString()}`);
    setIsFilterOpen(false);
  };
  const toggleCuisine = (cuisine: string) => {
    setStagedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };
  return (
    <div>
      {/* Search Bar */}
      {!hideSearchBar && (
        <form onSubmit={handleSearchSubmit} class="relative mb-10 md:mb-16 flex items-center w-full">
          <div class="relative flex-grow group">
            <div class="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none">
              <Search class="text-emerald w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search Chive for recipes, cuisines, or tags..."
              class="w-full bg-white border-2 border-emerald rounded-2xl py-3.5 md:py-5 pl-12 md:pl-14 pr-14 font-bold text-emerald sh-standard focus:sh-deep focus:outline-none transition-all placeholder:text-emerald/40 font-tech text-sm md:text-base mr-2"
              value={internalInputText}
              onInput={(e) => setInternalInputText((e.target as HTMLInputElement).value)}
            />
            {/* Filter Toggle Button */}
            <div class="absolute inset-y-0 right-3 flex items-center" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                class={`p-2 rounded-xl transition-all relative ${isFilterOpen ? 'bg-mint text-emerald' : 'text-emerald hover:bg-mint/50'
                  }`}
                aria-label="Toggle Filters"
              >
                <ListFilter class={`w-6 h-6 ${isFilterOpen ? 'scale-110' : ''}`} />
                {selectedCuisines.length > 0 && (
                  <span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full"></span>
                )}
              </button>
              {/* Popover */}
              {isFilterOpen && (
                <div class="absolute top-full right-0 mt-3 w-64 md:w-80 bg-white/95 backdrop-blur-md border-2 border-emerald rounded-2xl p-4 md:p-6 shadow-[8px_8px_0px_#ebf7ed] z-50 animate-slide-up">
                  <div class="flex justify-between items-center mb-4">
                    <h4 class="text-emerald font-brand text-sm md:text-base m-0">Popular Cuisines</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setStagedCuisines([]);
                        setSelectedCuisines([]);
                        setIsFilterOpen(false);
                      }}
                      class="text-[10px] md:text-xs text-emerald/60 hover:text-emerald font-tech underline uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {topCuisineState.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleCuisine(cuisine)}
                        class={`px-3 py-1.5 rounded-lg border-2 font-tech text-[10px] md:text-xs font-bold transition-all ${stagedCuisines.includes(cuisine)
                          ? 'bg-emerald text-white border-emerald shadow-[2px_2px_0px_#1e8449]'
                          : 'bg-mint/30 text-emerald border-emerald/20 hover:border-emerald'
                          }`}
                      >
                        {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div class="mt-6 pt-4 border-t border-emerald/10">
                    <button
                      type="button"
                      disabled={stagedCuisines.length === 0}
                      onClick={() => {
                        setSelectedCuisines(stagedCuisines);
                        setIsFilterOpen(false);
                      }}
                      class="w-full bg-emerald text-white py-2 rounded-xl font-brand font-bold text-sm hover:sh-deep transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      Apply {stagedCuisines.length} Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      ) /* End Search Bar */}
      {error ? (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Error loading recipes: {error}
        </div>
      ) : isTrendingCarousel ? (
        <RecipeCarousel recipes={displayedRecipes} loading={loading} expectedCount={expectedCount} />
      ) : (
        <>
          {showTrendingSeparator && !activeQuery && activeCuisines.length === 0 && (
            <div class="flex items-center gap-4 mb-10">
              <div class="bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                <Flame class="w-6 h-6 text-orange-500" />
              </div>
              <h2 class="text-2xl font-sharp text-slate-800 m-0">Trending on Chive</h2>
              <div class="flex-grow border-b-2 border-slate-100 ml-4"></div>
            </div>
          )}
          <RecipeGrid recipes={displayedRecipes} loading={loading} expectedCount={expectedCount} />
          {hasMore && !loading && (
            <div class="flex justify-center mt-12 pb-12">
              <button
                onClick={() => setVisibleCount(prev => prev + 24)}
                class="bg-white border-2 border-emerald text-emerald px-10 py-4 rounded-xl font-brand font-bold sh-standard hover:sh-deep hover:-translate-y-0.5 active:translate-y-0.5 active:sh-none transition-all cursor-pointer"
              >
                Show More Results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
