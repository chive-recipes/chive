export function SkeletonCard({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const isCompact = variant === 'compact';
  return (
    <div class={`border-2 border-mint overflow-hidden bg-white flex flex-col animate-pulse sh-standard h-full ${isCompact ? 'rounded-2xl' : 'rounded-2xl md:rounded-3xl'}`}>
      <div class={`${isCompact ? 'h-32 md:h-40' : 'aspect-[3/2]'} bg-mint/50 w-full`} />
      <div class={`${isCompact ? 'p-3 md:p-4' : 'p-4 md:p-5'} flex-grow flex flex-col gap-2 md:gap-3`}>
        <div class={`${isCompact ? 'h-5' : 'h-5 md:h-6'} bg-mint/50 w-3/4 rounded`} />
        
        <div class="flex flex-wrap gap-1.5 mt-0.5">
          <div class="h-4 md:h-5 w-12 bg-mint/50 rounded" />
          <div class="h-4 md:h-5 w-16 bg-mint/50 rounded" />
          <div class="h-4 md:h-5 w-10 bg-mint/50 rounded" />
        </div>

        <div class="mt-auto pt-2 flex gap-3">
          <div class="h-3 md:h-3.5 w-16 bg-mint/50 rounded" />
          <div class="h-3 md:h-3.5 w-20 bg-mint/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8 w-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <SkeletonCard variant="default" />
        </div>
      ))}
    </div>
  );
}
