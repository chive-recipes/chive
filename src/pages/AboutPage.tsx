import { ArrowUpRight } from 'lucide-preact';
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
}: {
  id: string;
  label: string;
  headline: string;
  children: preact.ComponentChildren;
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
        <div class="mt-6 space-y-4 text-base md:text-lg text-slate-500 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </section>
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
            A simple search for "how long to roast a chicken" now returns a wall of
            SEO-gamed prose, pop-up overlays, and autoplay videos. The actual recipe is
            somewhere at the bottom.
          </p>
          <p>
            Beyond the noise: the recipes you save are held on someone else's server. When
            that platform changes its terms or shuts down, your cookbook disappears with it.
          </p>
          <Pullquote>
            A recipe is a utility, not an SEO funnel. It belongs to the person cooking it.
          </Pullquote>
        </Chapter>

        {/* Chapter 2 — The UI */}
        <Chapter
          id="kitchen"
          label="02 — The design"
          headline="Fast, clean, out of your way."
        >
          <p>
            Chive is intentionally minimal. No ads, no autoplay, no newsletter
            banners. When you're mid-cook with flour on your hands, the page should just
            work — readable, instant, and obvious.
          </p>
          <p>
            Everything is formatted to actually cook from: ingredients on the left,
            steps front and centre, nothing competing for your attention.
          </p>
        </Chapter>

        {/* Chapter 3 — Ownership */}
        <Chapter
          id="ownership"
          label="03 — Ownership"
          headline="Your recipes stay yours."
        >
          <p>
            Chive is built on the <ExternalLink href="https://atproto.com">AT Protocol</ExternalLink> —
            an open network where your data lives in a repository you control, not one tied to
            this app. If Chive ever goes away, your recipes go with you, intact, to wherever you
            take them next.
          </p>
          <Pullquote>
            No lock-in. No export requests. You keep your recipes.
          </Pullquote>
          <p>
            It's a practical choice as much as a philosophical one: decentralized data means no single point of failure, and an open network ensures the platform remains free and sustainable for everyone.
          </p>
        </Chapter>

        {/* Chapter 4 — The Commons */}
        <Chapter
          id="commons"
          label="04 — The commons"
          headline="Open by default."
        >
          <p>
            Cooking has always worked this way — recipes get passed around, tweaked, and
            improved. Chive just makes that explicit. Everything here is shared under{' '}
            <ExternalLink href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</ExternalLink>:
            use it, adapt it, keep it open.
          </p>
          <p>
            Same licence as Wikipedia. Same idea.
          </p>
        </Chapter>

      </div>

    </main>
  );
}
