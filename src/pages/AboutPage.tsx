import { useState } from 'preact/hooks';
import { ArrowUpRight, ChevronDown } from 'lucide-preact';
import { useDocumentMetadata } from '../hooks/useDocumentMetadata';

// Decorative rule divider
function Rule() {
  return (
    <div class="flex items-center gap-4 my-2">
      <div class="h-[2px] w-8 bg-emerald" />
      <div class="w-2 h-2 rounded-full bg-emerald" />
    </div>
  );
}

// Inline pull quote
function Pullquote({ children }: { children: preact.ComponentChildren }) {
  return (
    <blockquote class="border-l-4 border-emerald pl-6 my-6 text-lg md:text-xl font-emphasis text-emerald leading-snug">
      {children}
    </blockquote>
  );
}

// External link with ArrowUpRight indicator
function ExternalLink({ href, children }: { href: string; children: preact.ComponentChildren }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      class="inline-items-center text-emerald font-bold underline decoration-emerald/40 hover:decoration-emerald transition-all"
    >
      {children}
      <ArrowUpRight class="inline w-3.5 h-3.5 ml-0.5 mb-0.5 opacity-60" />
    </a>
  );
}

// Section wrapper
function Chapter({
  id,
  label,
  headline,
  children,
  fullWidthChildren = false,
}: {
  id: string;
  label: string;
  headline: string;
  children: preact.ComponentChildren;
  fullWidthChildren?: boolean;
}) {
  return (
    <section id={id} class="py-14 md:py-20 border-b-2 border-slate-100 last:border-b-0">
      <div class="max-w-2xl">
        <span class="inline-block text-[10px] font-tech text-emerald uppercase tracking-[0.2em] mb-4 opacity-60">
          {label}
        </span>
        <h2 class="text-3xl md:text-4xl font-sharp text-slate-800 leading-[1.05] tracking-tight mb-6">
          {headline}
        </h2>
        <Rule />
      </div>
      <div class={`mt-6 space-y-4 text-base md:text-lg text-slate-500 leading-relaxed font-medium ${fullWidthChildren ? 'w-full' : 'max-w-2xl'}`}>
        {children}
      </div>
    </section>
  );
}

// FAQ Accordion Item
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div class="border-b border-slate-200 last:border-b-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        class="flex w-full items-center justify-between py-5 text-left text-lg font-sharp text-slate-800 hover:text-emerald transition-colors outline-none focus-visible:ring-2 focus-visible:ring-emerald rounded-md"
      >
        <span>{question}</span>
        <ChevronDown class={`w-5 h-5 text-slate-400 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180 text-emerald' : ''}`} />
      </button>
      <div 
        class={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div class="overflow-hidden">
          <p class="text-base md:text-lg text-slate-500 leading-relaxed m-0 font-medium">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function AboutPage() {
  useDocumentMetadata({
    title: "About Chive",
    description: "Chive is an open, community-driven recipe space. We believe recipes belong to everyone. Discover why we built Chive and how we use the AT Protocol."
  });
  return (
    <main class="animate-slide-up">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <header class="border-b-2 border-slate-100">
        <div class="max-w-4xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16">
          <h1 class="text-4xl md:text-6xl font-sharp text-slate-800 leading-[1.0] tracking-tight mb-5 m-0">
            Recipes belong<br />
            <span class="text-emerald font-emphasis">to everyone.</span>
          </h1>
          <p class="text-base md:text-lg text-slate-500 font-medium leading-relaxed max-w-xl m-0">
            Chive is an open, community-driven recipe space. It exists because looking up a recipe
            shouldn't require an obstacle course.
          </p>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div class="max-w-4xl mx-auto px-4 md:px-8">

        {/* Chapter 1 — The Problem */}
        <Chapter
          id="problem"
          label="01 — The problem"
          headline="Recipe sites got out of hand."
        >
          <p>
            A recipe is usually a short list of ingredients and a set of instructions. Online, it became an obstacle course of search-engine prose, autoplay video, pop-ups, account prompts, and advertisements. Even the recipes you save often remain trapped inside somebody else’s platform.
          </p>
        </Chapter>

        {/* Chapter 2 — The Design */}
        <Chapter
          id="kitchen"
          label="02 — The design"
          headline="Fast, clean, out of your way."
        >
          <p>
            Chive is a small attempt to do things differently: a fast, open recipe collection designed around the person actually cooking.
          </p>
          <p>
            It began with thousands of recipes, carefully cleaned up and organized into a consistent format. No advertisements. No newsletter ambush. No ten-paragraph introduction before the oven temperature.
          </p>
        </Chapter>

        {/* Chapter 3 — Ownership */}
        <Chapter
          id="ownership"
          label="03 — Ownership"
          headline="Your recipes stay yours."
        >
          <p>
            Chive is also an experiment in a different kind of ownership. Recipes you publish live in your <ExternalLink href="https://atproto.com">AT Protocol</ExternalLink> repository rather than in a private Chive database. Chive presents them, but it is not meant to become their permanent gatekeeper.
          </p>
        </Chapter>

        {/* Chapter 4 — FAQ */}
        <Chapter
          id="faq"
          label="04 — FAQ"
          headline="Frequently asked questions."
          fullWidthChildren={true}
        >
          <div class="mt-8 border-t border-slate-200">
            <FaqItem 
              question="Is Chive really free?"
              answer="Yes. We believe recipes should belong to everyone, unencumbered by ads, paywalls, or lock-in. Our goal is to build an open commons, not a walled garden."
            />
            <FaqItem 
              question="How does the AT Protocol work for recipes?"
              answer="Instead of storing your data in a closed database, we use the AT Protocol. It creates a personal repository for your recipes that you control. If you decide to leave Chive, your data goes with you."
            />
            <FaqItem 
              question="Can I import my recipes from other sites?"
              answer="Not yet, but we are actively working on tools to help you bring your existing recipe collections into your personal repository."
            />
            <FaqItem 
              question="Wait... is this AI generated?"
              answer="We use Large Language Models and diffusion models to cleanly parse, format, and illustrate our collection into a standardized, easy-to-read layout. But rest assured, these are real recipes from around the globe, created and tested by human cooks. We only use AI as a formatting tool, never to hallucinate ingredients or instructions."
            />
            <FaqItem 
              question="How does licensing work?"
              answer="All recipes published publicly on Chive are shared under a CC BY-SA 4.0 license, meaning anyone can use and adapt them as long as they provide attribution and share alike. Same as Wikipedia."
            />
            <FaqItem 
              question="How can I support Chive?"
              answer="The best way to support Chive is by using it! Add your favorite recipes, share them with others, and help us grow this open repository of culinary knowledge."
            />
          </div>
        </Chapter>

      </div>

    </main>
  );
}
