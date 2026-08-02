import { ChevronLeft, ChevronRight, ArrowRight, Flame } from 'lucide-preact';
import { useRef, useState, useEffect } from 'preact/hooks';
import type { RecordEnvelope } from '../lib/api';
import { RecipeCard } from './RecipeCard';
import { SkeletonCard } from './LoadingState';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface RecipeCarouselProps {
  recipes: RecordEnvelope[];
  loading?: boolean;
  expectedCount?: number;
}

export function RecipeCarousel({ recipes, loading = false, expectedCount = 0 }: RecipeCarouselProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  // Check scroll positions to enable/disable navigation buttons and calculate progress
  const checkScrollLimits = () => {
    const el = carouselRef.current;
    if (!el) return;
    
    // Tolerance of 5px for precision issues (e.g. subpixel layouts)
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
    
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd && el.scrollWidth > el.clientWidth);
    setIsScrollable(el.scrollWidth > el.clientWidth);

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(el.scrollLeft / maxScroll);
    } else {
      setScrollProgress(0);
    }
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    checkScrollLimits();
    const timer = setTimeout(checkScrollLimits, 150);
    
    el.addEventListener('scroll', checkScrollLimits);
    
    // Check again when window resizes or recipes change
    window.addEventListener('resize', checkScrollLimits);
    
    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', checkScrollLimits);
      window.removeEventListener('resize', checkScrollLimits);
    };
  }, [recipes, loading]);

  const scroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;

    // Scroll by cards width + gap
    const cardWidth = isMobile ? 200 : 260;
    const gap = isMobile ? 16 : 24;
    const scrollAmount = (cardWidth + gap) * (isMobile ? 2 : 3); // Scroll 2 cards on mobile, 3 on desktop

    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
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

  if (recipes.length === 0 && !loading) {
    return (
      <div class="py-12 text-center text-slate-500 font-tech">
        No trending recipes found.
      </div>
    );
  }

  // Calculate skeleton loaders
  const skeletonCount = loading ? Math.max(4, expectedCount) : 0;
  const skeletons = Array.from({ length: skeletonCount }, (_, i) => i);

  return (
    <div class="w-full">
      {/* Carousel Header with line divider */}
      <div class="flex items-center gap-4 mb-6">
        <div class="bg-orange-50 p-2 md:p-2.5 rounded-xl border border-orange-200">
          <Flame class="w-5 h-5 md:w-6 md:h-6 text-orange-500 fill-current animate-pulse" />
        </div>
        <h2 class="text-xl md:text-2xl font-sharp text-slate-800 m-0 whitespace-nowrap">Trending on Chive</h2>
        <div class="flex-grow border-b-2 border-slate-100 ml-4"></div>
      </div>

      {/* Carousel Scroll Area Wrapper */}
      <div class="relative w-full group/carousel">
        {/* Left Vignette/Glow Overlay - matches --color-paper background (#FDFDFD) */}
        <div 
          class={`absolute inset-y-0 left-0 w-8 md:w-16 bg-gradient-to-r from-paper via-paper/70 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft && isScrollable ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
        
        {/* Right Vignette/Glow Overlay - matches --color-paper background (#FDFDFD) */}
        <div 
          class={`absolute inset-y-0 right-0 w-8 md:w-16 bg-gradient-to-l from-paper via-paper/70 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight && isScrollable ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>

        {/* Scrollable Area */}
        <div
          ref={carouselRef}
          class="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory gap-4 md:gap-6 pt-2 pb-6 px-1 w-full"
        >
          {loading ? (
            skeletons.map((i) => (
              <div key={`skeleton-${i}`} class="w-[200px] sm:w-[230px] md:w-[260px] flex-shrink-0 snap-start">
                <SkeletonCard variant={isMobile ? 'compact' : 'default'} />
              </div>
            ))
          ) : (
            <>
              {recipes.map((envelope, idx) => (
                <div 
                  key={envelope.uri} 
                  class="w-[200px] sm:w-[230px] md:w-[260px] flex-shrink-0 snap-start animate-card-fade-in"
                  style={{ animationDelay: `${(idx % 8) * 50}ms` }}
                >
                  <RecipeCard 
                    recipeEnvelope={envelope} 
                    variant={isMobile ? 'compact' : 'default'}
                    isLcp={idx < 2}
                  />
                </div>
              ))}
              
              {/* Sleek Ending Carousel Card to prompt "Explore More" */}
              <div class="w-[160px] md:w-[200px] flex-shrink-0 snap-start flex items-stretch">
                <a
                  href="/explore"
                  class="w-full border-2 border-dashed border-emerald/40 hover:border-emerald rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-4 bg-mint/10 hover:bg-mint/30 transition-all p-4 md:p-6 text-center cursor-pointer no-underline text-emerald group sh-standard hover:sh-hover"
                >
                  <div class="bg-white p-3 md:p-4 rounded-full border border-emerald/20 group-hover:scale-110 transition-transform shadow-sm">
                    <ArrowRight class="w-5 h-5 text-emerald" />
                  </div>
                  <div>
                    <h4 class="font-sharp text-sm md:text-base text-slate-800 m-0 group-hover:text-emerald transition-colors">
                      Explore More
                    </h4>
                    <p class="text-[9px] md:text-[10px] text-slate-500 font-tech mt-1 uppercase tracking-wider">
                      all recipes
                    </p>
                  </div>
                </a>
              </div>
            </>
          )}
        </div>

        {/* Floating Left Navigation Button */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          class={`hidden md:block absolute left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border-2 border-emerald bg-white/95 backdrop-blur-sm text-emerald shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 select-none focus:outline-none ${
            canScrollLeft && isScrollable
              ? 'opacity-100 hover:bg-mint/80 cursor-pointer pointer-events-auto'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft class="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Navigation Button */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          class={`hidden md:block absolute right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full border-2 border-emerald bg-white/95 backdrop-blur-sm text-emerald shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 select-none focus:outline-none ${
            canScrollRight && isScrollable
              ? 'opacity-100 hover:bg-mint/80 cursor-pointer pointer-events-auto'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight class="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Page Indicators (Dynamic Snapped Dots) */}
      {isScrollable && !loading && (
        <div class="flex justify-center items-center gap-2 mt-4">
          {Array.from({ length: 5 }).map((_, i) => {
            const numDots = 5;
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
    </div>
  );
}
