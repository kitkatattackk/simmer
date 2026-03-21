import { useState, useEffect, useCallback } from 'react';
import { RecipeCard } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import { SettingsModal } from './components/SettingsModal';
import { Recipe, FilterState } from './types';
import { getInitialRecipes, searchRecipes } from './services/recipeService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { FilterBar } from './components/FilterBar';
import { WavyHero } from './components/WavyHero';
import { SearchChips } from './components/SearchChips';
import { SkeletonCard } from './components/SkeletonCard';
import { Bookmark, Settings, UtensilsCrossed, Flame, ChefHat } from 'lucide-react';
import { CookMode } from './components/CookMode';

type View = 'discover' | 'saved' | 'cook';

export default function App() {
  const [view, setView] = useState<View>('discover');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('savedRecipes');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || (parsed.length > 0 && typeof parsed[0] === 'string')) {
        localStorage.removeItem('savedRecipes');
        return [];
      }
      return parsed as Recipe[];
    } catch { return []; }
  });
  const [filters, setFilters] = useState<FilterState>({
    meatType: 'All', spiciness: 'All', difficulty: 'All',
    maxTime: 'All', searchQuery: '', allergy: 'No Allergy Filter', chef: 'All Chefs',
  });
  const [groceryList, setGroceryList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('groceryList') || '[]'); } catch { return []; }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('dietaryPrefs') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const handleSaveSettings = (prefs: string[]) => {
    setDietaryPrefs(prefs);
    localStorage.setItem('dietaryPrefs', JSON.stringify(prefs));
  };

  useEffect(() => {
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    localStorage.setItem('groceryList', JSON.stringify(groceryList));
  }, [groceryList]);

  const toggleGroceryItem = useCallback((item: string) => {
    setGroceryList(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  }, []);

  const toggleSave = useCallback((recipe: Recipe) => {
    setSavedRecipes(prev =>
      prev.some(r => r.id === recipe.id)
        ? prev.filter(r => r.id !== recipe.id)
        : [...prev, recipe]
    );
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecipes([]);
    try {
      await getInitialRecipes((recipes) => {
        setRecipes(recipes);
        setLoading(false);
      });
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const triggerSearch = async (overrideQuery?: string) => {
    const effectiveFilters = overrideQuery !== undefined
      ? { ...filters, searchQuery: overrideQuery }
      : filters;
    if (overrideQuery !== undefined) {
      setFilters(prev => ({ ...prev, searchQuery: overrideQuery }));
    }
    setLoading(true);
    setError(null);
    setRecipes([]);
    setView('discover');
    try {
      await searchRecipes(effectiveFilters.searchQuery, effectiveFilters, (recipes) => {
        setRecipes(recipes);
        setLoading(false);
      });
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const displayedRecipes = view === 'saved' ? savedRecipes : recipes;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>

      {/* Top Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-10 h-14 md:h-16"
        style={{
          backgroundColor: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => { setView('discover'); setSettingsOpen(false); }}
          style={{ fontFamily: '"Lilita One", sans-serif', fontSize: '1.4rem', color: 'var(--hero-color)', lineHeight: 1 }}
        >
          SIMMER
        </button>

        {/* Nav links — desktop only */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: 'Discover', action: () => { setView('discover'); setSettingsOpen(false); }, active: view === 'discover' && !settingsOpen },
            { label: 'Cook',     action: () => { setView('cook');     setSettingsOpen(false); }, active: view === 'cook'     && !settingsOpen },
            { label: 'Saved',    action: () => { setView('saved');    setSettingsOpen(false); }, active: view === 'saved'    && !settingsOpen },
          ].map(({ label, action, active }) => (
            <button
              key={label}
              onClick={action}
              className="px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider transition-all"
              style={active
                ? { backgroundColor: 'var(--nav-active-color)', color: 'var(--bg)' }
                : { color: 'var(--text)', opacity: 0.55 }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: saved count + settings */}
        <div className="flex items-center gap-2">
          {savedRecipes.length > 0 && (
            <button
              onClick={() => { setView('saved'); setSettingsOpen(false); }}
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: 'var(--text)', opacity: 0.6 }}
            >
              <Bookmark size={16} />
              <span>{savedRecipes.length}</span>
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(s => !s)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={settingsOpen
              ? { backgroundColor: '#2D472C', color: '#F5F0E8' }
              : { color: 'var(--text)', opacity: 0.55 }}
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center pt-2"
        style={{
          backgroundColor: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {[
          { label: 'Discover', icon: <UtensilsCrossed size={22} />, action: () => { setView('discover'); setSettingsOpen(false); }, active: view === 'discover' && !settingsOpen, badge: null },
          { label: 'Cook',     icon: <Flame size={22} />,           action: () => { setView('cook');    setSettingsOpen(false); }, active: view === 'cook'    && !settingsOpen, badge: null },
          { label: 'Saved',    icon: <Bookmark size={22} />,        action: () => { setView('saved');    setSettingsOpen(false); }, active: view === 'saved'    && !settingsOpen,
            badge: savedRecipes.length > 0 ? savedRecipes.length : null },
          { label: 'Settings', icon: <Settings size={22} />,        action: () => setSettingsOpen(s => !s), active: settingsOpen, badge: null },
        ].map(({ label, icon, action, active, badge }) => (
          <button
            key={label}
            onClick={action}
            className="relative flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-2xl transition-all"
            style={active
              ? { color: 'var(--nav-active-color)', backgroundColor: 'var(--nav-active-bg)' }
              : { color: 'var(--text)', opacity: 0.45 }}
          >
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            {badge && (
              <span className="absolute top-0.5 right-3 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full" style={{ backgroundColor: 'var(--nav-active-color)', color: 'var(--bg)' }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Hero — discover only */}
      {view === 'discover' && (
        <section className="px-4 pt-4 pb-8 md:px-8 md:pt-8 md:pb-12">
          <WavyHero />
          <FilterBar filters={filters} setFilters={setFilters} onSearch={() => triggerSearch()} isLoading={loading} />
          <SearchChips onSelect={(q) => triggerSearch(q)} isLoading={loading} activeQuery={filters.searchQuery} />
        </section>
      )}

      {/* Saved heading */}
      {view === 'saved' && (
        <section className="px-4 pt-6 pb-6 md:px-8">
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase' }}>
            Your Saved Recipes
          </h2>
        </section>
      )}

      {/* Cook view */}
      {view === 'cook' && (
        <section className="px-4 pt-6 pb-28 md:pb-16 md:px-8">
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase' }}>
            Cook Mode
          </h2>
          <p className="text-sm mt-1 mb-8" style={{ color: 'var(--text)', opacity: 0.55 }}>
            Pick a recipe to start step-by-step cooking
          </p>
          {savedRecipes.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display font-bold uppercase tracking-wide text-xl mb-4" style={{ color: 'var(--text)', opacity: 0.4 }}>No saved recipes yet</p>
              <button onClick={() => setView('discover')} className="font-semibold text-sm underline underline-offset-4" style={{ color: '#2D5A2D' }}>
                Discover recipes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedRecipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setCookingRecipe(recipe)}
                  className="text-left rounded-2xl p-5 border transition-all hover:shadow-lg active:scale-[0.98] group"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#2D472C' }}>
                    <ChefHat size={20} style={{ color: '#F5F0E8' }} />
                  </div>
                  <h3 className="font-display font-bold uppercase leading-tight mb-1" style={{ fontSize: '1rem', color: 'var(--on-surface)' }}>
                    {recipe.title}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: 'var(--on-surface-muted)' }}>
                    {recipe.prepTime} · {recipe.difficulty}
                  </p>
                  <div
                    className="w-full py-2.5 rounded-full text-sm font-bold uppercase tracking-wider text-center transition-all group-hover:opacity-90"
                    style={{ backgroundColor: '#2D472C', color: '#F5F0E8' }}
                  >
                    Start Cooking
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Divider — not shown for cook view */}
      {view !== 'cook' && <div className="mx-4 mb-6 md:mx-8 md:mb-10 h-px" style={{ backgroundColor: 'var(--text)', opacity: 0.15 }} />}

      {/* Grid */}
      <main className={cn("px-4 pb-28 md:pb-16 md:px-8", view === 'cook' && "hidden")}>
        {loading && recipes.length === 0 && view === 'discover' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity duration-300",
            loading ? "opacity-40 pointer-events-none" : "opacity-100"
          )}>
            {displayedRecipes.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(i * 0.06, 0.5) }}
              >
                <RecipeCard
                  recipe={recipe}
                  isSaved={savedRecipes.some(r => r.id === recipe.id)}
                  onSaveToggle={() => toggleSave(recipe)}
                  onClick={setSelectedRecipe}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty states */}
        {!loading && view === 'discover' && recipes.length === 0 && (
          <div className="text-center py-32">
            {error ? (
              <>
                <p className="font-display font-bold uppercase text-lg mb-2" style={{ color: '#c0392b' }}>Something went wrong</p>
                <p className="text-sm max-w-xl mx-auto mb-6 font-mono rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)' }}>{error}</p>
              </>
            ) : (
              <p className="font-display font-bold uppercase tracking-wide text-xl mb-4" style={{ color: 'var(--text)', opacity: 0.4 }}>No recipes found</p>
            )}
            <button onClick={loadInitialData} className="font-semibold text-sm underline underline-offset-4" style={{ color: '#2D5A2D' }}>
              Reset to featured recipes
            </button>
          </div>
        )}

        {view === 'saved' && savedRecipes.length === 0 && (
          <div className="text-center py-32">
            <p className="font-display font-bold uppercase tracking-wide text-xl mb-4" style={{ color: 'var(--text)', opacity: 0.4 }}>No saved recipes yet</p>
            <button onClick={() => setView('discover')} className="font-semibold text-sm underline underline-offset-4" style={{ color: '#2D5A2D' }}>
              Discover recipes
            </button>
          </div>
        )}
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isSaved={selectedRecipe ? savedRecipes.some(r => r.id === selectedRecipe.id) : false}
        onSaveToggle={() => selectedRecipe && toggleSave(selectedRecipe)}
        onClose={() => setSelectedRecipe(null)}
        groceryList={groceryList}
        onGroceryToggle={toggleGroceryItem}
        onGroceryClear={(items) => setGroceryList(prev => prev.filter(i => !items.includes(i)))}
      />

      {/* Cook Mode overlay (launched from Cook view) */}
      <AnimatePresence>
        {cookingRecipe && (
          <CookMode recipe={cookingRecipe} onClose={() => setCookingRecipe(null)} />
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode(d => !d)}
        dietaryPrefs={dietaryPrefs}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
