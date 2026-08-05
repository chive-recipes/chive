import type { ComponentChildren } from 'preact';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ComponentChildren;
  eyebrow?: string;
  actions?: ComponentChildren;
  class?: string;
}

export function PageHeader({ title, description, icon, eyebrow, actions, class: className = '' }: PageHeaderProps) {
  return (
    <header class={`mb-10 md:mb-12 ${className}`}>
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div class="max-w-3xl">
          {eyebrow && (
            <div class="font-tech text-[11px] uppercase tracking-[0.18em] text-forest mb-3">
              {eyebrow}
            </div>
          )}
          <div class="flex items-center gap-3 md:gap-4">
            {icon && (
              <div class="w-11 h-11 md:w-12 md:h-12 bg-mint border-2 border-emerald rounded-2xl flex items-center justify-center shrink-0 text-emerald">
                {icon}
              </div>
            )}
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-sharp leading-[1.05] tracking-tighter text-slate-800 m-0">
              {title}
            </h1>
          </div>
          {description && (
            <p class="text-base md:text-lg text-slate-500 max-w-2xl leading-relaxed font-medium mt-4 mb-0">
              {description}
            </p>
          )}
        </div>
        {actions && <div class="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
