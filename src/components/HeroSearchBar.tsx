import { Search, ArrowRight } from 'lucide-preact';
import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';

export function HeroSearchBar() {
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('Search recipes...');

  useEffect(() => {
    const handleResize = () => {
      setPlaceholder(window.innerWidth < 480 ? 'Search recipes...' : 'Search recipes, cuisines, or tags...');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (query.trim()) {
      route(`/explore?q=${encodeURIComponent(query.trim())}`);
    } else {
      route('/explore');
    }
  };

  return (
    <form onSubmit={handleSubmit} class="relative w-full max-w-lg mt-8 md:mt-10 animate-slide-up" style="animation-delay: 0.1s; animation-fill-mode: backwards;">
      <div class="relative flex-grow group">
        <div class="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none">
          <Search class="text-emerald w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          class="w-full bg-white border-2 border-emerald rounded-2xl py-3.5 md:py-4 pl-12 md:pl-14 pr-20 md:pr-24 font-bold text-emerald sh-standard focus:sh-deep focus:outline-none transition-all placeholder:text-emerald/40 font-tech text-sm md:text-base"
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        <div class="absolute inset-y-0 right-2 md:right-3 flex items-center gap-2">
          {/* Keyboard Hint: only shown when query is empty, hidden on mobile */}
          <span
            class={`hidden sm:inline-flex items-center gap-1 bg-mint text-emerald/60 border border-emerald/20 px-2.5 py-1 rounded-xl text-xs font-tech tracking-wider select-none transition-all duration-300 ${
              query ? 'opacity-0 scale-90 pointer-events-none absolute right-4' : 'opacity-100 scale-100'
            }`}
          >
            ENTER <span class="font-sans text-[10px] select-none">↵</span>
          </span>
          {/* Action Button: animates in when user types */}
          <button
            type="submit"
            aria-label="Search"
            class={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-emerald text-white border-2 border-emerald hover:bg-forest hover:border-forest hover:scale-105 active:scale-95 transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald/50 ${
              query
                ? 'opacity-100 scale-100 translate-x-0'
                : 'opacity-0 scale-90 translate-x-4 pointer-events-none absolute right-0'
            }`}
          >
            <ArrowRight class="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </form>
  );
}
