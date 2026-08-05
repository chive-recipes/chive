import { useEffect, useState, useRef } from 'preact/hooks';
import { ChefHat, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-preact';
import { fetchCollections, fetchRecipe, imageUrl, extractDid } from '../lib/api';
import type { CollectionEnvelope, RecordEnvelope } from '../lib/api';

// A specialized card for the cinematic Netflix-style carousel
function CinematicCard({ collection }: { collection: CollectionEnvelope }) {
  const c = collection.value;
  const recipeCount = c.recipes.length;
  const [coverRecipe, setCoverRecipe] = useState<RecordEnvelope | null>(null);

  useEffect(() => {
    if (c.recipes.length > 0) {
      fetchRecipe(c.recipes[0].rkey)
        .then(setCoverRecipe)
        .catch(err => console.error(`Failed to fetch cover recipe ${c.recipes[0].rkey}:`, err));
    }
  }, [c.recipes]);

  return (
    <a
      href={`/collections/${c.slug}`}
      class="group relative block w-full h-[400px] md:h-[500px] rounded-2xl md:rounded-3xl overflow-hidden sh-standard hover:sh-hover hover:-translate-y-1 transition-all no-underline shrink-0 bg-slate-100 ring-1 ring-inset ring-slate-900/10"
    >
      {/* Background Image */}
      {coverRecipe ? (
        <img
          src={imageUrl(coverRecipe.value.image?.ref?.$link || coverRecipe.value.thumbnail?.ref?.$link, "fullsize", extractDid(coverRecipe.uri))}
          alt=""
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          loading="lazy"
        />
      ) : (
        <div class="absolute inset-0 bg-emerald/5 animate-pulse" />
      )}

      {/* Content Positioned in a Glass Panel */}
      <div class="absolute bottom-4 left-4 right-4 md:bottom-10 md:left-10 md:right-auto md:w-[500px] lg:w-[600px] bg-white/85 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-white/50 shadow-sm flex flex-col">
        <div>
          <div class="flex items-center gap-3 mb-3 md:mb-4">
            <span class="select-none text-4xl md:text-5xl shrink-0 leading-none">{c.emoji}</span>
            <h3 class="text-3xl md:text-5xl font-sharp leading-snug group-hover:text-emerald transition-colors m-0 text-slate-800 text-balance drop-shadow-sm">
              {c.name}
            </h3>
          </div>
          
          {c.description && (
            <p class="text-base md:text-xl text-slate-700 leading-relaxed m-0 mb-6 font-medium line-clamp-2 md:line-clamp-none drop-shadow-sm">
              {c.description}
            </p>
          )}

          <div class="flex items-center gap-4 flex-wrap mt-2">
            <div class="inline-flex items-center gap-1.5 text-xs md:text-sm font-tech uppercase tracking-tight text-emerald font-semibold bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-emerald/20 shadow-sm">
              <ChefHat class="w-4 h-4 md:w-5 md:h-5" />
              {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export function HomepageCollections() {
  const [collections, setCollections] = useState<CollectionEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCollections();
        // Filter out the trending collection since the homepage already has a trending feed
        const filtered = data.filter(c => c.value.slug !== 'trending');
        // Take top 3 for the carousel layout
        setCollections(filtered.slice(0, 3));
      } catch (e) {
        console.error("Failed to load collections for homepage:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const checkScrollLimits = () => {
    const el = carouselRef.current;
    if (!el) return;
    
    setIsScrollable(el.scrollWidth > el.clientWidth);

    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollProgress(maxScroll > 0 ? el.scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    checkScrollLimits();
    const timer = setTimeout(checkScrollLimits, 150);
    
    el.addEventListener('scroll', checkScrollLimits);
    window.addEventListener('resize', checkScrollLimits);
    
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScrollLimits);
      window.removeEventListener('resize', checkScrollLimits);
    };
  }, [collections, loading]);

  const scroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const scrollAmount = el.clientWidth;

    if (direction === 'left' && el.scrollLeft <= 5) {
      // Loop to end
      el.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else if (direction === 'right' && el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
      // Loop to start
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      // Normal scroll
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollToPercent = (percent: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: maxScroll * percent,
      behavior: 'smooth'
    });
  };

  if (loading || collections.length === 0) {
    return null; // Don't show anything on error/loading to avoid homepage jank
  }

  return (
    <section class="mt-8 mb-24 animate-slide-up relative">
      <div class="flex items-center gap-4 mb-6">
        <div class="bg-emerald-50 p-2 md:p-2.5 rounded-xl border border-emerald-100">
          <Sparkles class="w-5 h-5 md:w-6 md:h-6 text-emerald" />
        </div>
        <h2 class="text-xl md:text-2xl font-sharp text-slate-800 m-0 whitespace-nowrap">
          Curated Collections
        </h2>
        <div class="flex-grow border-b-2 border-slate-100 ml-4"></div>
        <a href="/collections" class="hidden md:flex items-center gap-2 text-emerald hover:text-emerald/80 font-sharp text-sm md:text-base group transition-colors no-underline font-bold shrink-0">
          <span>Explore all</span>
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      <div class="relative w-full group/carousel">
        {/* Scrollable Area */}
        <div
          ref={carouselRef}
          class="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-4 md:gap-6 pt-2 pb-2 px-1 w-full"
        >
          {collections.map((c) => (
            <div key={c.uri} class="w-full flex-shrink-0 snap-center">
              <CinematicCard collection={c} />
            </div>
          ))}
        </div>

        {/* Floating Left Navigation Button */}
        <button
          onClick={() => scroll('left')}
          class={`hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border-2 border-emerald bg-white/95 backdrop-blur-sm text-emerald shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 select-none focus:outline-none ${
            isScrollable
              ? 'opacity-100 hover:bg-mint/80 cursor-pointer pointer-events-auto'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Navigation Button */}
        <button
          onClick={() => scroll('right')}
          class={`hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border-2 border-emerald bg-white/95 backdrop-blur-sm text-emerald shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 select-none focus:outline-none ${
            isScrollable
              ? 'opacity-100 hover:bg-mint/80 cursor-pointer pointer-events-auto'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Page Indicators (Dynamic Snapped Dots) */}
      {isScrollable && !loading && (
        <div class="flex justify-center items-center gap-2 mt-6">
          {collections.map((_, i) => {
            const numDots = collections.length;
            const activeDotIndex = Math.min(numDots - 1, Math.round(scrollProgress * (numDots - 1)));
            const isActive = activeDotIndex === i;
            return (
              <button
                key={i}
                onClick={() => scrollToPercent(i / (numDots - 1))}
                class={`h-2 rounded-full transition-all duration-300 focus:outline-none ${
                  isActive ? 'w-6 bg-emerald' : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      )}
      
      <div class="mt-6 md:hidden flex justify-center">
        <a href="/collections" class="inline-flex items-center gap-2 text-emerald hover:text-emerald/80 font-sharp text-base group transition-colors no-underline font-bold">
          <span>Explore all collections</span>
          <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </section>
  );
}
