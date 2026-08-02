import { ArrowLeft, Share2, ChefHat, Flame, Bookmark, Link, Printer, Check, ShoppingCart, Copy, Trash2 } from 'lucide-preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { imageUrl, formatDuration, DID, deleteRecipe } from '../lib/api';
import type { RecordEnvelope } from '../lib/api';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAuth } from '../hooks/useAuth';
import { getSessionFetchHandler } from '../lib/auth';
import { RecipeCreatorBadge } from './RecipeCreatorBadge';
interface RecipePageProps {
  recipeEnvelope: RecordEnvelope;
}
export function RecipePage({ recipeEnvelope }: RecipePageProps) {
  const recipe = recipeEnvelope.value;
  const authorDid = recipeEnvelope.uri.split('/')[2];
  const heroUrl = imageUrl(recipe.image.ref.$link, "fullsize", authorDid);
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(recipeEnvelope.uri);
  const { user } = useAuth();
  
  const isOfficial = !authorDid || authorDid === DID;
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIngredients, setCopiedIngredients] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const copyWithFeedback = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleCopyLink = () => copyWithFeedback(window.location.href, setCopiedLink);

  const handleCopyIngredients = () => {
    let text = `Shopping List: ${recipe.name}\n\n`;
    recipe.ingredients.forEach((ing: string) => text += `[ ] ${ing}\n`);
    copyWithFeedback(text, setCopiedIngredients);
  };
  const handlePrint = () => {
    setShareOpen(false);
    window.print();
  };
  const handleBack = (e: MouseEvent) => {
    if (typeof window !== 'undefined' && (window as any).__chive_nav_count > 1) {
      e.preventDefault();
      window.history.back();
    }
  };

  const handleDelete = async () => {
    const handler = getSessionFetchHandler();
    if (!user || !handler) return;
    setIsDeleting(true);
    try {
      const rkey = recipeEnvelope.uri.split('/').pop()!;
      await deleteRecipe(handler, user.did, rkey);
      route(`/profile/${user.handle}`);
    } catch (e) {
      console.error("Failed to delete recipe:", e);
      alert("Failed to delete recipe. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      {/* Print-Only View */}
      <div class="hidden print:block p-8 bg-white text-black font-sans max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 font-emphasis">{recipe.name}</h1>
        {recipe.description && <p class="text-lg text-gray-700 mb-8 leading-relaxed">{recipe.description}</p>}
        
        <div class="grid grid-cols-3 gap-8 mb-8 text-sm">
          {recipe.times?.total && <div><strong>Time:</strong> {formatDuration(recipe.times.total)}</div>}
          {recipe.yield && <div><strong>Servings:</strong> {recipe.yield}</div>}
          {recipe.cuisine && <div class="capitalize"><strong>Cuisine:</strong> {recipe.cuisine}</div>}
        </div>

        <div class="mb-10">
          <h2 class="text-2xl font-bold mb-4 border-b-2 border-black pb-2 uppercase tracking-widest font-tech">Ingredients</h2>
          <ul class="list-none pl-0 space-y-2">
            {recipe.ingredients.map((ing: string, idx: number) => (
              <li key={idx} class="text-lg flex gap-3">
                <span class="text-gray-400 mt-1">☐</span> {ing}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 class="text-2xl font-bold mb-4 border-b-2 border-black pb-2 uppercase tracking-widest font-tech">Instructions</h2>
          <div class="space-y-6">
            {recipe.steps.map((step: string, idx: number) => (
              <div key={idx} class="flex gap-4">
                <span class="font-bold text-lg">{idx + 1}.</span>
                <p class="text-lg m-0">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Screen View */}
      <main class="max-w-6xl mx-auto p-4 md:p-8 animate-slide-up print:hidden w-full">
        {/* Top Bar */}
      <div class="flex justify-between items-center mb-10 print:hidden">
        <a 
          href="/" 
          onClick={handleBack}
          class="flex items-center gap-2 font-brand text-emerald hover:-translate-x-1 transition-transform no-underline"
        >
          <ArrowLeft class="w-5 h-5" />
          <span class="font-tech text-sm mt-0.5">BACK</span>
        </a>
        <div class="flex gap-3 relative z-40" ref={shareRef}>
          {user?.did === authorDid && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              class="p-3 rounded-xl border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer bg-transparent"
              title="Delete Recipe"
            >
              <Trash2 class="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShareOpen(!shareOpen)}
            class={`p-3 rounded-xl border-2 border-emerald hover:bg-emerald hover:text-white transition-all cursor-pointer ${shareOpen ? 'bg-emerald text-white' : 'bg-mint text-emerald'}`}
          >
            <Share2 class="w-5 h-5" />
          </button>
          {shareOpen && (
            <div class="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border-2 border-emerald sh-deep overflow-hidden z-40 flex flex-col font-medium font-tech uppercase text-xs tracking-wider animate-slide-up origin-top-right">
              <button onClick={handleCopyLink} class="flex items-center gap-3 px-4 py-4 text-emerald border-none bg-white hover:bg-mint w-full text-left cursor-pointer transition-colors m-0 text-inherit border-b-2 border-emerald/10">
                {copiedLink ? <Check class="w-4 h-4" /> : <Link class="w-4 h-4" />}
                {copiedLink ? 'Copied Link!' : 'Copy Link'}
              </button>
              <button onClick={handleCopyIngredients} class="flex items-center gap-3 px-4 py-4 text-emerald border-none bg-white hover:bg-mint w-full text-left cursor-pointer transition-colors m-0 text-inherit border-b-2 border-emerald/10">
                {copiedIngredients ? <Check class="w-4 h-4" /> : <ShoppingCart class="w-4 h-4" />}
                {copiedIngredients ? 'Copied List!' : 'Copy Ingredients'}
              </button>
              <button onClick={handlePrint} class="flex items-center gap-3 px-4 py-4 text-emerald border-none bg-white hover:bg-mint w-full text-left cursor-pointer transition-colors m-0 text-inherit">
                <Printer class="w-4 h-4" />
                Print Recipe
              </button>
            </div>
          )}
          <button
            onClick={() => toggleBookmark(recipeEnvelope)}
            class="bg-mint text-emerald px-6 py-3 rounded-xl border-2 border-emerald hover:bg-emerald hover:text-white transition-all cursor-pointer font-brand flex items-center justify-center gap-2 w-32"
          >
            <Bookmark class={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            {bookmarked ? 'SAVED' : 'SAVE'}
          </button>
        </div>
      </div>
      {/* Top Section: Image and Title/Desc */}
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center mb-16">
        {/* Left: Image */}
        <div class="w-full lg:flex-[1.5] shrink-0 flex flex-col">
          <div class={`w-full aspect-[16/10] md:aspect-[4/3] border-2 border-emerald rounded-2xl md:rounded-[2rem] overflow-hidden sh-standard relative shrink-0 ${!imageLoaded ? 'bg-mint/50 animate-pulse' : 'bg-mint/10'}`}>
            <img src={heroUrl} alt={recipe.name} class={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} fetchpriority="high" onLoad={() => setImageLoaded(true)} />
            <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none print:hidden" />
            {/* Verified Badge Tooltip */}
            {isOfficial && (
              <div class="absolute top-6 right-6 group/tooltip print:hidden flex items-center cursor-help">
                <div class="overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover/tooltip:max-w-[220px] group-hover/tooltip:opacity-100 flex items-center justify-end pr-2 pointer-events-none">
                  <span class="bg-white/95 backdrop-blur-sm text-[#3b82f6] px-2.5 py-1 rounded-lg text-[10px] font-tech font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border border-[#3b82f6]/30">
                    Official Chive Recipe
                  </span>
                </div>
                <div class="relative z-30">
                  <RecipeCreatorBadge recipeUri={recipeEnvelope.uri} variant="card-overlay" />
                </div>
              </div>
            )}
            <div class="absolute bottom-6 left-6 flex gap-2 flex-wrap">
              {recipe.tags?.map(tag => (
                <span key={tag} class="bg-white/90 backdrop-blur text-emerald border border-emerald px-3 py-1 rounded text-[10px] font-tech uppercase">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Title, Desc, Meta */}
        <div class="w-full lg:flex-1 flex flex-col justify-center">
          <h1 class="text-4xl md:text-5xl lg:text-5xl font-emphasis mb-4 leading-[0.95] tracking-tight text-slate-800 m-0">
            {recipe.name}
          </h1>
          {recipe.description && (
            <p class="text-base md:text-lg text-slate-500 mb-4 max-w-2xl leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Creator Info / Verified Badge */}
          <div class="mb-5">
            <RecipeCreatorBadge recipeUri={recipeEnvelope.uri} variant="detail" />
          </div>

          {/* Meta Badges */}
          <div class="grid grid-cols-3 gap-2 md:gap-3">
            <div class="bg-mint p-2 md:p-3 rounded-xl border-2 border-emerald flex flex-col justify-center min-w-0">
              <span class="block text-[9px] md:text-[10px] uppercase font-brand text-emerald/60 mb-0.5 md:mb-1 font-tech truncate">Time</span>
              <span class="text-sm md:text-base font-bold text-emerald truncate">{recipe.times?.total ? formatDuration(recipe.times.total) : 'N/A'}</span>
            </div>
            <div class="bg-mint p-2 md:p-3 rounded-xl border-2 border-emerald flex flex-col justify-center min-w-0">
              <span class="block text-[9px] md:text-[10px] uppercase font-brand text-emerald/60 mb-0.5 md:mb-1 font-tech truncate">Servings</span>
              <span class="text-sm md:text-base font-bold text-emerald truncate">{recipe.yield || 'N/A'}</span>
            </div>
            <div class="bg-mint p-2 md:p-3 rounded-xl border-2 border-emerald flex flex-col justify-center min-w-0">
              <span class="block text-[9px] md:text-[10px] uppercase font-brand text-emerald/60 mb-0.5 md:mb-1 font-tech truncate">Cuisine</span>
              <span class="text-sm md:text-base font-bold text-emerald capitalize truncate">{recipe.cuisine || 'Mixed'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Instructions and Manifests */}
      <div class="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
        {/* Left Column: Instructions (and mobile ingredients) */}
        <div class="flex-[1.5] w-full">
          {/* Mobile-only Ingredients */}
          <div class="lg:hidden mb-12">
            <IngredientsManifest recipe={recipe} />
          </div>
          {/* Instructions */}
          <div class="space-y-12 instructions-container">
            <h3 class="text-3xl md:text-4xl font-brand flex items-center gap-4 tracking-tighter m-0 text-slate-800">
              <div class="w-10 h-10 bg-mint border-2 border-emerald rounded-xl flex items-center justify-center shrink-0">
                <ChefHat class="text-emerald w-6 h-6" />
              </div>
              <span>Instructions</span>
            </h3>
            <div class="space-y-12">
              {recipe.steps.map((step, idx) => (
                <div key={idx} class="flex gap-6 md:gap-8 items-start group">
                  <div class="flex flex-col items-center shrink-0">
                    <span class="text-4xl md:text-5xl font-brand text-mint leading-none group-hover:text-emerald/20 transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {idx !== recipe.steps.length - 1 && <div class="w-0.5 !w-0.5 h-full min-h-16 bg-mint mt-4" />}
                  </div>
                  <p class="text-lg md:text-xl leading-relaxed pt-2 font-medium text-slate-700 m-0">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile-only Nutrition Info */}
          {recipe.nutrition && (
            <div class="lg:hidden mt-12 mb-8 print:hidden">
              <NutritionInfo recipe={recipe} />
            </div>
          )}
        </div>
        {/* Right Column: Manifests (Desktop Only) */}
        <div class="hidden lg:flex flex-1 w-full lg:sticky lg:top-24 flex-col gap-10 lg:max-h-[calc(100vh-8rem)] pb-8">
          <DesktopManifests recipe={recipe} />
        </div>
      </div>
      {/* Bottom spacer to allow sticky containers to meet the bottom comfortably */}
      <div class="md:h-32 h-12" />
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-[2rem] p-8 max-w-md w-full border-2 border-rose-500 sh-deep animate-slide-up">
            <div class="w-16 h-16 bg-rose-100 border-2 border-rose-500 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
              <Trash2 class="w-8 h-8" />
            </div>
            <h3 class="text-2xl font-sharp text-slate-800 mb-2">Delete Recipe?</h3>
            <p class="text-slate-600 mb-8 font-medium">
              This action cannot be undone. Are you sure you want to permanently delete <strong class="text-slate-800">{recipe.name}</strong> from the network?
            </p>
            <div class="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                class="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-brand transition-colors cursor-pointer bg-transparent"
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                class="flex-1 px-6 py-3 rounded-xl bg-rose-500 border-2 border-rose-500 text-white font-brand hover:-translate-y-[1px] transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function DesktopManifests({ recipe }: { recipe: any }) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'nutrition'>('ingredients');
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    let text = `Shopping List: ${recipe.name}\n\n`;
    recipe.ingredients.forEach((ing: string) => text += `[ ] ${ing}\n`);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateScrollIndicators = () => {
    const el = scrollRef.current;
    if (!el) return;

    // Show top shadow if scrolled down
    setShowTopShadow(el.scrollTop > 5);

    // Show bottom shadow if there is more to scroll down
    const hasScrollableContent = el.scrollHeight > el.clientHeight;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
    setShowBottomShadow(hasScrollableContent && !isAtBottom);
  };

  // Check scroll indicators on tab swap, data change, and initial load
  useEffect(() => {
    // Small timeout to allow the browser to paint and calculate correct layout dimensions
    const timer = setTimeout(updateScrollIndicators, 50);
    return () => clearTimeout(timer);
  }, [activeTab, recipe]);

  return (
    <div class="bg-emerald rounded-3xl overflow-hidden sh-standard border-2 border-emerald flex flex-col min-h-0">
      {recipe.nutrition ? (
        <div class="flex shrink-0 z-20 relative border-b-2 border-emerald">
          <button
            class={`flex-1 px-5 py-4 flex items-center justify-center gap-2 font-tech uppercase tracking-[0.2em] text-sm transition-colors border-none m-0 cursor-pointer ${activeTab === 'ingredients' ? 'text-white bg-emerald' : 'text-emerald bg-mint hover:bg-white'}`}
            onClick={() => setActiveTab('ingredients')}
          >
            <span>Ingredients</span>
            {activeTab === 'ingredients' && (
              <span
                onClick={handleCopy}
                title="Copy ingredients to clipboard"
                class="hover:opacity-80 transition-opacity p-0.5 inline-flex items-center"
              >
                {copied ? <Check class="w-3.5 h-3.5" /> : <Copy class="w-3.5 h-3.5" />}
              </span>
            )}
          </button>
          <button
            class={`flex-1 px-5 py-4 flex items-center justify-center font-tech uppercase tracking-[0.2em] text-sm transition-colors border-none border-l-2 border-emerald m-0 cursor-pointer ${activeTab === 'nutrition' ? 'text-white bg-emerald' : 'text-emerald bg-mint hover:bg-white'}`}
            onClick={() => setActiveTab('nutrition')}
          >
            Nutrition
          </button>
        </div>
      ) : (
        <div class="bg-emerald px-5 py-4 flex items-center justify-between shrink-0 z-20 relative border-b-2 border-emerald">
          <div class="w-6" />
          <span class="text-sm font-sharp text-white tracking-[0.2em] font-tech uppercase pl-4">
            Ingredients
          </span>
          <button
            onClick={handleCopy}
            title="Copy ingredients to clipboard"
            class="text-white/80 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1 m-0 flex items-center justify-center"
          >
            {copied ? <Check class="w-4 h-4 text-white" /> : <Copy class="w-4 h-4" />}
          </button>
        </div>
      )}

      <div class="p-0 bg-paper relative flex-1 min-h-0 flex flex-col">
        {/* Top Scroll Indicator Shadow */}
        <div 
          class={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showTopShadow ? 'opacity-100' : 'opacity-0'}`} 
        />

        <div 
          ref={scrollRef}
          onScroll={updateScrollIndicators}
          class="overflow-y-auto overflow-x-hidden p-8 flex-1 pill-scrollbar"
        >
          {activeTab === 'ingredients' ? (
            <IngredientsList ingredients={recipe.ingredients} />
          ) : (
            <NutritionGrid nutrition={recipe.nutrition} />
          )}
        </div>

        {/* Bottom Scroll Indicator Shadow */}
        <div 
          class={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/5 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showBottomShadow ? 'opacity-100' : 'opacity-0'}`} 
        />
      </div>
    </div>
  );
}

function IngredientsManifest({ recipe }: { recipe: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    let text = `Shopping List: ${recipe.name}\n\n`;
    recipe.ingredients.forEach((ing: string) => text += `[ ] ${ing}\n`);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div class="bg-emerald rounded-3xl overflow-hidden sh-standard border-2 border-emerald flex flex-col">
      <div class="bg-emerald px-5 py-4 flex items-center justify-between shrink-0 z-20 relative">
        <div class="w-6" />
        <span class="text-sm font-sharp text-white tracking-[0.2em] font-tech uppercase pl-4">
          Ingredients
        </span>
        <button
          onClick={handleCopy}
          title="Copy ingredients to clipboard"
          class="text-white/80 hover:text-white transition-colors border-none bg-transparent cursor-pointer p-1 m-0 flex items-center justify-center"
        >
          {copied ? <Check class="w-4 h-4 text-white" /> : <Copy class="w-4 h-4" />}
        </button>
      </div>
      <div class="p-8 bg-paper flex-1 min-h-0">
        <IngredientsList ingredients={recipe.ingredients} />
      </div>
    </div>
  );
}

function NutritionInfo({ recipe }: { recipe: any }) {
  if (!recipe.nutrition) return null;
  return (
    <div class="bg-emerald rounded-3xl overflow-hidden sh-standard border-2 border-emerald flex flex-col nutrition-card">
      <div class="bg-emerald px-5 py-4 flex items-center justify-center shrink-0 z-20 relative">
        <span class="text-sm font-sharp text-white tracking-[0.2em] font-tech uppercase">
          Nutrition Info
        </span>
      </div>
      <div class="p-8 bg-paper flex-1 min-h-0">
        <NutritionGrid nutrition={recipe.nutrition} />
      </div>
    </div>
  );
}

function IngredientsList({ ingredients }: { ingredients: string[] }) {
  return (
    <ul class="space-y-4 m-0 p-0">
      {ingredients.map((ing: string, idx: number) => (
        <li key={idx} class="flex items-start justify-between text-lg font-bold text-forest">
          <div class="flex items-start gap-4">
            <div class="w-5 h-5 mt-1 shrink-0 rounded-md bg-mint border-2 border-emerald flex items-center justify-center text-[10px] text-emerald leading-none">✓</div>
            <span>{ing}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NutritionGrid({ nutrition }: { nutrition: any }) {
  return (
    <div class="grid grid-cols-2 gap-y-6 gap-x-8">
      {nutrition.calories && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <Flame class="w-3 h-3 text-orange-400" /> Calories
          </span>
          <span class="text-xl font-bold text-forest">{nutrition.calories}</span>
        </div>
      )}
      {nutrition.proteinContent && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1">Protein</span>
          <span class="text-xl font-bold text-forest">{nutrition.proteinContent}</span>
        </div>
      )}
      {nutrition.fatContent && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1">Total Fat</span>
          <span class="text-xl font-bold text-forest">{nutrition.fatContent}</span>
        </div>
      )}
      {nutrition.carbohydrateContent && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1">Carbs</span>
          <span class="text-xl font-bold text-forest">{nutrition.carbohydrateContent}</span>
        </div>
      )}
      {nutrition.sugarContent && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1">Sugar</span>
          <span class="text-xl font-bold text-forest">{nutrition.sugarContent}</span>
        </div>
      )}
      {nutrition.fiberContent && (
        <div class="flex flex-col">
          <span class="text-[10px] font-tech text-slate-400 uppercase tracking-widest mb-1">Fiber</span>
          <span class="text-xl font-bold text-forest">{nutrition.fiberContent}</span>
        </div>
      )}
    </div>
  );
}
