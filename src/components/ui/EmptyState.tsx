import type { ComponentChildren } from 'preact';

interface EmptyStateProps {
  icon: ComponentChildren;
  title: string;
  description: ComponentChildren;
  action?: ComponentChildren;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <section class={`text-center bg-white rounded-[2rem] border-2 border-slate-200 border-dashed flex flex-col items-center px-6 ${compact ? 'py-14' : 'py-16 md:py-20'}`}>
      <div class="w-16 h-16 bg-mint border-2 border-emerald rounded-2xl flex items-center justify-center mb-5 text-emerald">
        {icon}
      </div>
      <h2 class="text-2xl font-sharp text-slate-800 mb-2">{title}</h2>
      <div class={`text-slate-500 max-w-md ${action ? 'mb-7' : ''}`}>
        {description}
      </div>
      {action}
    </section>
  );
}
