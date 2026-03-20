import { Recipe, FilterState } from '../types';
import { DUMMY_RECIPES } from './dummyData';

const USE_DUMMY_DATA = false;

async function fetchRecipes(query: string, filters: FilterState): Promise<Recipe[]> {
  const params = new URLSearchParams({
    query,
    meatType: filters.meatType,
    spiciness: filters.spiciness,
    difficulty: filters.difficulty,
    maxTime: filters.maxTime,
    allergy: filters.allergy,
    chef: filters.chef ?? 'All Chefs',
  });
  const res = await fetch(`/api/recipes?${params}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const getInitialRecipes = async (onUpdate: (recipes: Recipe[]) => void): Promise<void> => {
  if (USE_DUMMY_DATA) { onUpdate(DUMMY_RECIPES); return; }
  const recipes = await fetchRecipes('__initial__', {
    meatType: 'All', spiciness: 'All', difficulty: 'All',
    maxTime: 'All', searchQuery: '', allergy: 'No Allergy Filter', chef: 'All Chefs',
  });
  onUpdate(recipes);
};

export const searchRecipes = async (
  query: string,
  filters: FilterState,
  onUpdate: (recipes: Recipe[]) => void,
): Promise<void> => {
  if (USE_DUMMY_DATA) { onUpdate(DUMMY_RECIPES); return; }
  const recipes = await fetchRecipes(query, filters);
  onUpdate(recipes);
};
