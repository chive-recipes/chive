import { useEffect, useState } from 'preact/hooks';
import { ChefHat, ArrowRight } from 'lucide-preact';
import { fetchRecipe, imageUrl, extractDid } from '../lib/api';
import type { CollectionEnvelope, RecordEnvelope } from '../lib/api';

interface CollectionCardProps {
  collection: CollectionEnvelope;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const c = collection.value;
  const recipeCount = c.recipes.length;
  const [coverRecipe, setCoverRecipe] = useState<RecordEnvelope | null>(null);

  useEffect(() => {
    if (c.recipes.length > 0) {
      fetchRecipe(c.recipes[0].rkey)
        .then(setCoverRecipe)
        .catch(err => console.error(`Failed to fetch cover recipe ${c.recipes[0].rkey}:`, err));
    }
  }, [c.recipes]);

  return (
    <a
      href={`/collections/${c.slug}`}
      class="group cursor-pointer border-2 border-slate-100 overflow-hidden hover:-translate-y-1 transition-all bg-white flex flex-col sh-standard hover:sh-hover no-underline text-inherit block h-full rounded-2xl md:rounded-3xl"
    >
      {/* Cover Image Area */}
      <div class="h-48 md:h-52 w-full bg-gradient-to-br from-mint via-mint/60 to-emerald/10 relative overflow-hidden flex items-center justify-center shrink-0">
        {coverRecipe ? (
          <img
            src={imageUrl(coverRecipe.value.thumbnail?.ref?.$link || coverRecipe.value.image?.ref?.$link, "thumbnail", extractDid(coverRecipe.uri))}
            alt={c.name}
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div class="absolute inset-0 bg-gradient-to-br from-mint via-mint/60 to-emerald/10 animate-pulse" />
        )}
      </div>

      {/* Card Body */}
      <div class="p-4 md:p-5 flex-grow flex flex-col gap-2 md:gap-3">
        <h3 class="text-base md:text-lg font-sharp leading-snug group-hover:text-emerald transition-colors line-clamp-2 m-0 text-slate-800 flex items-center gap-2">
          <span class="select-none text-2xl md:text-3xl shrink-0">{c.emoji}</span>
          <span>{c.name}</span>
        </h3>

        {c.description && (
          <p class="text-sm text-slate-500 leading-relaxed line-clamp-2 m-0">
            {c.description}
          </p>
        )}

        {/* Footer */}
        <div class="flex items-center justify-between mt-auto pt-2">
          <span class="flex items-center gap-1.5 text-[10px] md:text-[11px] font-tech uppercase tracking-tight text-emerald font-semibold">
            <ChefHat class="w-3.5 h-3.5" />
            {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
          </span>
          <span class="w-7 h-7 rounded-full bg-mint flex items-center justify-center group-hover:bg-emerald group-hover:text-white transition-all">
            <ArrowRight class="w-3.5 h-3.5 text-emerald group-hover:text-white transition-colors" />
          </span>
        </div>
      </div>
    </a>
  );
}
