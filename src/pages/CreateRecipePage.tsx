import { useState, useRef } from 'preact/hooks';
import { useAuth } from '../hooks/useAuth';
import { route } from 'preact-router';
import { processRecipeImage } from '../lib/imageUtils';
import { publishRecipe, uploadBlob } from '../lib/api';
import { getSessionFetchHandler, getCurrentDid } from '../lib/auth';
import { Plus, X, Upload, LoaderCircle, Image as ImageIcon } from 'lucide-preact';
import { Button } from '../components/ui/Button';

export function CreateRecipePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipeYield, setRecipeYield] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['']);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthLoading && !user) {
    if (typeof window !== 'undefined') {
      route('/login');
    }
    return null;
  }

  const handleImageChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
    }
  };

  const formatIsoDuration = (mins: string) => {
    if (!mins) return undefined;
    const m = parseInt(mins, 10);
    if (isNaN(m) || m <= 0) return undefined;
    
    const hours = Math.floor(m / 60);
    const minutes = m % 60;
    
    let iso = 'PT';
    if (hours > 0) iso += `${hours}H`;
    if (minutes > 0) iso += `${minutes}M`;
    return iso === 'PT' ? undefined : iso;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const did = getCurrentDid();
      const handler = getSessionFetchHandler();
      
      if (!did || !handler) {
        throw new Error("You must be logged in to post a recipe.");
      }

      if (!name.trim()) {
        throw new Error("Recipe name is required.");
      }

      // Filter out empty ingredients and steps
      const finalIngredients = ingredients.filter(i => i.trim() !== '');
      const finalSteps = steps.filter(s => s.trim() !== '');

      if (finalIngredients.length === 0) {
        throw new Error("Please add at least one ingredient.");
      }
      if (finalSteps.length === 0) {
        throw new Error("Please add at least one step.");
      }

      let imageRef: any = undefined;
      let thumbnailRef: any = undefined;

      // Handle Image Processing & Upload
      if (imageFile) {
        const { fullsize, thumbnail } = await processRecipeImage(imageFile);
        
        // Upload both blobs
        const [fullsizeBlob, thumbnailBlob] = await Promise.all([
          uploadBlob(handler, fullsize.blob),
          uploadBlob(handler, thumbnail.blob),
        ]);
        
        imageRef = fullsizeBlob;
        thumbnailRef = thumbnailBlob;
      } else {
        throw new Error("Please upload an image for your recipe.");
      }

      // Prepare Recipe Data
      const recipeData: any = {
        name: name.trim(),
        description: description.trim(),
        ingredients: finalIngredients,
        steps: finalSteps,
        image: imageRef,
        thumbnail: thumbnailRef,
        yield: recipeYield.trim() || undefined,
        times: {
          prep: formatIsoDuration(prepTime),
          cook: formatIsoDuration(cookTime),
          total: formatIsoDuration(String((parseInt(prepTime || "0") + parseInt(cookTime || "0")) || ""))
        }
      };

      // Remove undefined times if they are empty
      if (!recipeData.times?.prep && !recipeData.times?.cook && !recipeData.times?.total) {
        delete recipeData.times;
      }

      const result = await publishRecipe(handler, did, recipeData);
      
      // Redirect to the new recipe page
      const rkey = result.uri.split('/').pop();
      if (rkey) {
        route(`/recipe/${user?.handle || did}/${rkey}`);
      } else {
        route('/');
      }

    } catch (err: any) {
      console.error("Failed to post recipe:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div class="flex justify-center p-12"><LoaderCircle class="animate-spin text-emerald w-8 h-8" /></div>;
  }

  return (
    <div class="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-sharp text-slate-800 mb-2">Post a Recipe</h1>
        <p class="text-slate-500 font-tech">Share your culinary creations with the world.</p>
      </div>

      {error && (
        <div class="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 font-sharp text-sm flex items-start gap-3">
          <div class="w-5 h-5 shrink-0 mt-0.5">⚠️</div>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-8">
        
        {/* Basic Info */}
        <div class="bg-white p-6 rounded-2xl border-2 border-mint shadow-[4px_4px_0px_#ebf7ed]">
          <h2 class="text-xl font-brand text-emerald mb-4">Basic Details</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1 font-sharp">Recipe Name *</label>
              <input
                type="text"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:translate-y-[-1px] focus:outline-none transition-all font-tech"
                placeholder="e.g., Grandma's Apple Pie"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1 font-sharp">Description</label>
              <textarea
                value={description}
                onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
                class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:translate-y-[-1px] focus:outline-none transition-all font-tech min-h-[100px] resize-y"
                placeholder="A brief description of this recipe..."
              />
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1 font-sharp">Yield</label>
                <input
                  type="text"
                  value={recipeYield}
                  onInput={(e) => setRecipeYield((e.target as HTMLInputElement).value)}
                  class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:outline-none transition-all font-tech"
                  placeholder="e.g., 4 servings"
                />
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1 font-sharp">Prep Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTime}
                  onInput={(e) => setPrepTime((e.target as HTMLInputElement).value)}
                  class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:outline-none transition-all font-tech"
                  placeholder="15"
                />
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1 font-sharp">Cook Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={cookTime}
                  onInput={(e) => setCookTime((e.target as HTMLInputElement).value)}
                  class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:outline-none transition-all font-tech"
                  placeholder="45"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div class="bg-white p-6 rounded-2xl border-2 border-mint shadow-[4px_4px_0px_#ebf7ed]">
          <h2 class="text-xl font-brand text-emerald mb-4">Recipe Photo *</h2>
          
          <div 
            class={`border-2 border-dashed rounded-xl overflow-hidden relative transition-colors ${
              imagePreview ? 'border-emerald bg-mint/10' : 'border-emerald/40 hover:border-emerald bg-mint/20 hover:bg-mint/40 cursor-pointer'
            }`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div class="relative aspect-video w-full bg-slate-900 group">
                <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    class="bg-white text-slate-800 px-4 py-2 rounded-lg font-sharp font-bold text-sm hover:scale-105 transition-transform"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    class="bg-red-500 text-white px-4 py-2 rounded-lg font-sharp font-bold text-sm hover:scale-105 transition-transform"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center border-2 border-mint mb-4 text-emerald">
                  <ImageIcon class="w-8 h-8" />
                </div>
                <div class="font-sharp font-bold text-emerald mb-1">Click to upload photo</div>
                <div class="font-tech text-sm text-slate-500 max-w-xs">High quality photos make your recipe stand out. We'll automatically optimize it for the web.</div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              class="hidden" 
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Ingredients */}
        <div class="bg-white p-6 rounded-2xl border-2 border-mint shadow-[4px_4px_0px_#ebf7ed]">
          <h2 class="text-xl font-brand text-emerald mb-4">Ingredients *</h2>
          <div class="space-y-3 mb-4">
            {ingredients.map((ingredient, index) => (
              <div key={index} class="flex items-start gap-2">
                <input
                  type="text"
                  value={ingredient}
                  onInput={(e) => handleIngredientChange(index, (e.target as HTMLInputElement).value)}
                  class="flex-grow bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:outline-none transition-all font-tech"
                  placeholder="e.g., 2 cups all-purpose flour"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length === 1}
                  class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  aria-label="Remove ingredient"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            class="flex items-center gap-2 text-emerald hover:text-emerald/80 font-sharp font-bold text-sm"
          >
            <Plus class="w-4 h-4" /> Add another ingredient
          </button>
        </div>

        {/* Steps */}
        <div class="bg-white p-6 rounded-2xl border-2 border-mint shadow-[4px_4px_0px_#ebf7ed]">
          <h2 class="text-xl font-brand text-emerald mb-4">Instructions *</h2>
          <div class="space-y-4 mb-4">
            {steps.map((step, index) => (
              <div key={index} class="flex items-start gap-3">
                <div class="shrink-0 w-8 h-8 rounded-full bg-mint text-emerald font-brand flex items-center justify-center font-bold mt-1">
                  {index + 1}
                </div>
                <div class="flex-grow flex items-start gap-2">
                  <textarea
                    value={step}
                    onInput={(e) => handleStepChange(index, (e.target as HTMLTextAreaElement).value)}
                    class="w-full bg-mint/30 border-2 border-emerald rounded-xl py-2 px-3 text-slate-800 focus:shadow-[2px_2px_0px_#27ae60] focus:outline-none transition-all font-tech min-h-[80px] resize-y"
                    placeholder="Describe this step..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    disabled={steps.length === 1}
                    class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 mt-1"
                    aria-label="Remove step"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStep}
            class="flex items-center gap-2 text-emerald hover:text-emerald/80 font-sharp font-bold text-sm"
          >
            <Plus class="w-4 h-4" /> Add another step
          </button>
        </div>

        {/* Submit */}
        <div class="pt-4 flex justify-end">
          <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle class="w-5 h-5 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Upload class="w-5 h-5" />
                Publish Recipe
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
