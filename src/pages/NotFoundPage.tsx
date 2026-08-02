import { ArrowLeft, Cookie } from 'lucide-preact';

export function NotFoundPage() {
  return (
    <main class="max-w-lg mx-auto text-center px-6 py-20 md:py-32 flex flex-col items-center justify-center animate-slide-up w-full">

      {/* Styled Icon */}
      <div class="relative w-24 h-24 bg-mint border-2 border-emerald rounded-[2rem] flex items-center justify-center text-emerald shadow-[8px_8px_0px_#ebf7ed] mb-8 shrink-0">
        <Cookie class="w-12 h-12 stroke-[1.5]" />
        {/* Bite mark representation / decoration */}
        <div class="absolute -top-1 -right-1 w-6 h-6 bg-paper border-b-2 border-l-2 border-emerald rounded-full" />
      </div>

      {/* Message */}
      <h1 class="text-3xl md:text-5xl font-sharp text-slate-800 leading-[1.05] tracking-tight mb-4 m-0">
        Looks like this page<br />
        <span class="text-emerald font-emphasis">got eaten.</span>
      </h1>
      <p class="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-sm mb-10 m-0">
        We searched the entire kitchen pantry, but we couldn't find what you're looking for. It might have been deleted, moved, or devoured.
      </p>

      {/* Home link button */}
      <a
        href="/"
        class="inline-flex items-center gap-2 bg-white text-emerald hover:bg-emerald hover:text-white border-2 border-emerald px-6 py-3 rounded-xl font-brand hover:translate-y-[2px] transition-all cursor-pointer no-underline text-center shadow-[4px_4px_0px_#27ae60] shrink-0"
      >
        <ArrowLeft class="w-4 h-4" />
        Back to the Feed
      </a>
    </main>
  );
}
