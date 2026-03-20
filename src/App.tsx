import { useState, useEffect, useCallback } from 'react';
import { RecipeCard } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import { Recipe, FilterState } from './types';
import { getInitialRecipes, searchRecipes } from './services/recipeService';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import { FilterBar } from './components/FilterBar';
import { WavyHero } from './components/WavyHero';
import { SearchChips } from './components/SearchChips';
import { SkeletonCard } from './components/SkeletonCard';

type View = 'discover' | 'saved';

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

  useEffect(() => {
    localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6">
        <span style={{ fontFamily: '"Lilita One", sans-serif', fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#2D6A2D' }}>
          SIMMER
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('discover')}
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-semibold transition-all"
            style={view === 'discover'
              ? { backgroundColor: '#1C3A1C', color: '#F5F0E8', borderColor: '#1C3A1C' }
              : { backgroundColor: 'transparent', color: '#1C3A1C', borderColor: '#1C3A1C' }}
          >
            Discover
          </button>
          <button
            onClick={() => setView('saved')}
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-semibold transition-all"
            style={view === 'saved'
              ? { backgroundColor: '#1C3A1C', color: '#F5F0E8', borderColor: '#1C3A1C' }
              : { backgroundColor: 'transparent', color: '#1C3A1C', borderColor: '#1C3A1C' }}
          >
            Saved {savedRecipes.length > 0 && `(${savedRecipes.length})`}
          </button>
        </div>
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
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#1C3A1C', textTransform: 'uppercase' }}>
            Your Saved Recipes
          </h2>
        </section>
      )}

      {/* Divider */}
      <div className="mx-4 mb-6 md:mx-8 md:mb-10 h-px" style={{ backgroundColor: '#1C3A1C', opacity: 0.15 }} />

      {/* Grid */}
      <main className="px-4 pb-24 md:px-8">
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
                <p className="text-sm max-w-xl mx-auto mb-6 font-mono rounded-xl px-4 py-3" style={{ backgroundColor: '#EDE7D9', color: '#555' }}>{error}</p>
              </>
            ) : (
              <p className="font-display font-bold uppercase tracking-wide text-xl mb-4" style={{ color: '#1C3A1C', opacity: 0.4 }}>No recipes found</p>
            )}
            <button onClick={loadInitialData} className="font-semibold text-sm underline underline-offset-4" style={{ color: '#2D5A2D' }}>
              Reset to featured recipes
            </button>
          </div>
        )}

        {view === 'saved' && savedRecipes.length === 0 && (
          <div className="text-center py-32">
            <p className="font-display font-bold uppercase tracking-wide text-xl mb-4" style={{ color: '#1C3A1C', opacity: 0.4 }}>No saved recipes yet</p>
            <button onClick={() => setView('discover')} className="font-semibold text-sm underline underline-offset-4" style={{ color: '#2D5A2D' }}>
              Discover recipes
            </button>
          </div>
        )}
      </main>

      {/* Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isSaved={selectedRecipe ? savedRecipes.some(r => r.id === selectedRecipe.id) : false}
        onSaveToggle={() => selectedRecipe && toggleSave(selectedRecipe)}
        onClose={() => setSelectedRecipe(null)}
      />

      {/* Footer */}
      <footer className="border-t px-4 py-6 md:px-8 md:py-8 flex items-center justify-between text-xs font-medium" style={{ borderColor: '#1C3A1C', color: '#1C3A1C' }}>
        <span className="font-display font-bold uppercase tracking-widest" style={{ opacity: 0.5 }}>Simmer</span>
        <span style={{ opacity: 0.4 }}>Powered by Gemini AI</span>
      </footer>
    </div>
  );
}
