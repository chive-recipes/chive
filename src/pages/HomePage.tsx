import { Zap, ShieldX, Globe, Sparkles, ArrowRight } from 'lucide-preact';
import { RecipeDiscovery } from '../components/RecipeDiscovery';
import { HeroAnimation } from '../components/HeroAnimation';
import { HeroSearchBar } from '../components/HeroSearchBar';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

export function HomePage() {
  useDocumentMetadata({});
  return (
    <main class="max-w-6xl mx-auto pt-12 px-4 pb-4 md:p-8 animate-slide-up w-full">
      {/* Hero Section */}
      <header class="mb-8 md:mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <div class="hidden md:inline-flex items-center gap-2 bg-mint px-3 py-1 rounded-full border border-emerald mb-6">
            <Zap class="w-3 h-3 text-emerald fill-current" />
            <span class="text-[10px] font-brand uppercase tracking-widest text-emerald font-tech">
              Cook it, share it, repeat
            </span>
          </div>
          <h1 class="text-5xl md:text-7xl font-sharp mb-6 leading-[0.85] tracking-tighter m-0 text-slate-800">
            Better recipes, <br />
            <span class="text-emerald font-emphasis">together.</span>
          </h1>
          <p class="text-base md:text-xl text-slate-500 max-w-xl leading-relaxed font-medium mb-8 m-0">
            Discover, cook, and remix recipes without the clutter. Chive is a fast, lightweight, and ad-free platform built for home cooks.
          </p>
          <HeroSearchBar />
        </div>
        <div class="hidden lg:block relative w-full h-[600px]">
          <HeroAnimation />
        </div>
      </header>
      <RecipeDiscovery showTrendingSeparator={true} hideSearchBar={true} />

      {/* Why Chive Section */}
      <section class="mt-24 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div class="text-center mb-12">
          <h2 class="text-3xl md:text-5xl font-sharp text-slate-800 mb-4">
            Recipes Belong to Everyone.
          </h2>
          <p class="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            A decentralized platform built for cooks, communities, and the open web.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {/* Pillar 1 */}
          <div class="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-emerald/20 sh-standard hover:sh-deep transition-shadow flex flex-col">
            <h3 class="text-xl md:text-2xl font-sharp text-slate-800 mb-3 flex items-center gap-3">
              <ShieldX class="w-6 h-6 text-emerald shrink-0" />
              <span>No Ads, Just Recipes</span>
            </h3>
            <p class="text-base text-slate-500 leading-relaxed m-0">
              Finding dinner shouldn't mean sitting through popup ads or endless life stories. Chive delivers clean, fast recipes without the bloat.
            </p>
          </div>

          {/* Pillar 2 */}
          <div class="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-emerald/20 sh-standard hover:sh-deep transition-shadow flex flex-col">
            <h3 class="text-xl md:text-2xl font-sharp text-slate-800 mb-3 flex items-center gap-3">
              <Globe class="w-6 h-6 text-emerald shrink-0" />
              <span>Decentralized</span>
            </h3>
            <p class="text-base text-slate-500 leading-relaxed m-0">
              Powered by the AT Protocol. Your recipes are yours, stored in an open network that prioritizes data portability over siloed platforms.
            </p>
          </div>

          {/* Pillar 3 */}
          <div class="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-emerald/20 sh-standard hover:sh-deep transition-shadow flex flex-col">
            <h3 class="text-xl md:text-2xl font-sharp text-slate-800 mb-3 flex items-center gap-3">
              <Sparkles class="w-6 h-6 text-emerald shrink-0" />
              <span>Open & Collaborative</span>
            </h3>
            <p class="text-base text-slate-500 leading-relaxed m-0">
              Every recipe is shared under a Creative Commons license. Remix, adapt, and build upon global food cultures together.
            </p>
          </div>
        </div>

        <div class="flex justify-center">
          <a href="/about" class="inline-flex items-center gap-2 text-emerald hover:text-emerald/80 font-sharp text-lg group transition-colors no-underline">
            <span>Learn more about our mission</span>
            <div class="bg-mint p-1.5 rounded-full group-hover:bg-emerald/20 transition-colors">
              <ArrowRight class="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
