import { Clock, Users } from 'lucide-preact';
import { useState } from 'preact/hooks';
import { imageUrl, extractRkey, extractDid, formatDuration, capitalize } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';
import { RecipeCreatorBadge } from './RecipeCreatorBadge';
interface RecipeCardProps {
  recipeEnvelope: RecordEnvelope;
  variant?: 'default' | 'compact';
  isLcp?: boolean;
}
export function RecipeCard({ recipeEnvelope, variant = 'default', isLcp = false }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const recipe = recipeEnvelope.value;
  const rkey = extractRkey(recipeEnvelope.uri);
  const did = extractDid(recipeEnvelope.uri);
  const isCompact = variant === 'compact';
  const thumbUrl = imageUrl(recipe.thumbnail.ref.$link, "thumbnail", did);
  const timeStr = recipe.times?.total ? formatDuration(recipe.times.total) : '';
  const displayTags = recipe.tags?.slice(0, 3) || [];
  return (
    <a href={`/recipe/${did}/${rkey}`} class={`group cursor-pointer border-2 border-slate-100 overflow-hidden hover:-translate-y-1 transition-all bg-white flex flex-col sh-standard hover:sh-hover no-underline text-inherit block h-full ${isCompact ? 'rounded-2xl' : 'rounded-2xl md:rounded-3xl'}`}>
      {/* Image with cuisine overlay badge */}
      <div class={`${isCompact ? 'h-32 md:h-40' : 'aspect-[3/2] w-full'} overflow-hidden relative ${!imageLoaded ? 'bg-mint/50 animate-pulse' : 'bg-mint/10'}`}>
        <img 
          src={thumbUrl} 
          alt={recipe.name} 
          class={`w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
          loading={isLcp ? undefined : "lazy"}
          fetchpriority={isLcp ? "high" : undefined}
          onLoad={() => setImageLoaded(true)}
        />
        {recipe.cuisine && (
          <div class="absolute top-2 left-2 pointer-events-none">
            <span class="bg-white/90 backdrop-blur-sm text-emerald px-2 py-0.5 rounded-lg text-[9px] md:text-[10px] font-tech uppercase tracking-wide border border-emerald/10 shadow-sm">
              {recipe.cuisine}
            </span>
          </div>
        )}
        <div class="absolute top-2 right-2 pointer-events-none z-10">
          <RecipeCreatorBadge recipeUri={recipeEnvelope.uri} variant="card-overlay" />
        </div>
      </div>
      <div class={`${isCompact ? 'p-3 md:p-4' : 'p-4 md:p-5'} flex-grow flex flex-col gap-2 md:gap-3`}>
        <div class="flex flex-col gap-1.5">
          <h3 class={`${isCompact ? 'text-[15px] md:text-lg' : 'text-base md:text-lg'} font-sharp leading-snug group-hover:text-emerald transition-colors line-clamp-2 m-0`}>
            {recipe.name}
          </h3>
          <RecipeCreatorBadge recipeUri={recipeEnvelope.uri} variant="card-body" />
        </div>
        {displayTags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-0.5">
            {displayTags.map(tag => (
              <span key={tag} class="bg-mint/30 text-emerald px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-tech font-bold uppercase tracking-wider border border-emerald/10">
                {capitalize(tag)}
              </span>
            ))}
          </div>
        )}
        {/* Lightweight Meta Footer */}
        <div class="flex items-center gap-3 text-[10px] md:text-[11px] font-tech uppercase tracking-tight text-emerald mt-auto pt-2">
          {timeStr && (
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3 md:w-3.5 md:h-3.5" /> {timeStr}
            </span>
          )}
          {recipe.yield && (
            <span class="flex items-center gap-1">
              <Users class="w-3 h-3 md:w-3.5 md:h-3.5" /> {recipe.yield}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
