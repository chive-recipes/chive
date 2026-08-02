import { ArrowRight, ArrowUpRight } from 'lucide-preact';

export function Footer() {
  return (
    <footer class="bg-emerald text-white mt-20 pt-16 pb-12 print:hidden animate-fade-in">
      <div class="max-w-4xl mx-auto px-4 md:px-8">
        {/* Top Section: Heading and Actions */}
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-white/10 items-end">
          <div class="md:col-span-7">
            <h2 class="text-3xl md:text-5xl font-sharp text-white leading-[0.95] tracking-tight m-0 mb-4 text-left">
              Recipes belong<br />
              <span class="text-emerald-100 font-emphasis opacity-90">to everyone.</span>
            </h2>
            <p class="text-emerald-100/75 text-sm font-medium max-w-md m-0 leading-relaxed text-left">
              Chive is an open-source, decentralized project built on the AT Protocol. No ads, no tracking, no lock-in.
            </p>
          </div>

          <div class="md:col-span-5 flex flex-col sm:flex-row md:flex-col gap-3 justify-end items-stretch md:items-end">
            <a
              href="/explore"
              class="inline-flex items-center justify-center gap-2 bg-white text-emerald px-6 py-3.5 rounded-xl font-brand hover:translate-y-[2px] transition-all cursor-pointer no-underline text-center shadow-[4px_4px_0px_#1e8449] border-none"
            >
              Explore Recipes
              <ArrowRight class="w-4 h-4" />
            </a>
            <a
              href="https://github.com/agoodyer/chive"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 hover:border-white/40 hover:text-white px-6 py-3 rounded-xl font-tech text-xs uppercase tracking-widest transition-all cursor-pointer no-underline text-center"
            >
              View Source
              <ArrowUpRight class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Section: Branding and Meta Links */}
        <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-8">
          <div class="hidden md:flex items-center gap-2 select-none">
            <span class="w-5 h-5 inline-flex items-center justify-center">
              <svg viewBox="0 0 64 65" class="w-4 h-4 fill-current stroke-current text-white">
                <g transform="matrix(0.920107,0,0,0.920107,-355.555,-444.393)">
                  <path
                    d="M415.242,550.594L415.674,528.13L398.826,541.234L389.178,522.514L409.338,516.178L392.49,504.226L407.322,489.25L418.842,506.53L425.034,485.794L443.754,495.586L430.794,513.01L452.538,512.578L449.082,533.458L428.922,525.97L436.122,546.994L415.242,550.594Z"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    style="fill-rule:nonzero;stroke-width:4px;"
                  />
                </g>
              </svg>
            </span>
            <span class="font-brand text-sm tracking-tighter text-white">Chive</span>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-tech uppercase tracking-widest text-white/50">
            <a
              href="https://bsky.app/profile/getchive.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white transition-colors no-underline inline-flex items-center gap-1"
            >
              <span>Bluesky</span>
              <ArrowUpRight class="w-3 h-3 opacity-70" />
            </a>
            <span class="text-white/20">|</span>
            <a
              href="https://github.com/agoodyer/chive"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-white transition-colors no-underline inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ArrowUpRight class="w-3 h-3 opacity-70" />
            </a>
            <span class="text-white/20">|</span>
            <span class="text-white/50">
              © 2026 Chive
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
