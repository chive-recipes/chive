import { useEffect } from 'preact/hooks';
import type { ChiveRecipe } from '../lib/api';
import { imageUrl, extractDid } from '../lib/api';

/**
 * Injects a JSON-LD structured data script into the head of the document
 * for Google SEO discoverability.
 */
export function useRecipeSchema(recipe?: ChiveRecipe, recipeUri?: string) {
  useEffect(() => {
    if (typeof window === 'undefined' || !recipe || !recipeUri) return;

    // Helper to format ISO duration or return as-is since api stores them as ISO already
    const formatTime = (timeStr?: string) => timeStr || undefined;

    // Map ChiveRecipe to schema.org/Recipe
    const schema = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.name,
      "image": [
        recipe.image?.ref?.$link ? imageUrl(recipe.image.ref.$link, "fullsize", extractDid(recipeUri)) : undefined,
      ].filter(Boolean),
      "author": {
        "@type": "Person",
        "name": "Chive User"
      },
      "datePublished": recipe.createdAt,
      "description": recipe.description,
      "recipeYield": recipe.yield,
      "prepTime": formatTime(recipe.times?.prep),
      "cookTime": formatTime(recipe.times?.cook),
      "totalTime": formatTime(recipe.times?.total),
      "recipeIngredient": recipe.ingredients,
      "recipeInstructions": recipe.steps?.map((step) => ({
        "@type": "HowToStep",
        "text": step
      })),
      "nutrition": recipe.nutrition ? {
        "@type": "NutritionInformation",
        "calories": recipe.nutrition.calories,
        "fatContent": recipe.nutrition.fatContent,
        "saturatedFatContent": recipe.nutrition.saturatedFatContent,
        "unsaturatedFatContent": recipe.nutrition.unsaturatedFatContent,
        "carbohydrateContent": recipe.nutrition.carbohydrateContent,
        "fiberContent": recipe.nutrition.fiberContent,
        "sugarContent": recipe.nutrition.sugarContent,
        "proteinContent": recipe.nutrition.proteinContent,
        "sodiumContent": recipe.nutrition.sodiumContent,
        "cholesterolContent": recipe.nutrition.cholesterolContent,
        "servingSize": recipe.nutrition.servingSize,
      } : undefined
    };

    // Remove undefined fields
    const cleanSchema = JSON.parse(JSON.stringify(schema));

    let script = document.querySelector('#recipe-json-ld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'recipe-json-ld';
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(cleanSchema);

    return () => {
      const existing = document.querySelector('#recipe-json-ld');
      if (existing) {
        existing.remove();
      }
    };
  }, [recipe]);
}
