import { Recipe, FilterState } from '../types';

const MAX_TIME_MAP: Record<string, number> = {
  'Under 15 mins': 15,
  'Under 30 mins': 30,
  'Under 60 mins': 60,
};

const ALLERGY_KEYWORDS: Record<string, string[]> = {
  'Gluten-Free':    ['wheat', 'flour', 'gluten', 'barley', 'rye', 'bread', 'pasta', 'soy sauce'],
  'Dairy-Free':     ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'dairy'],
  'Nut-Free':       ['nut', 'almond', 'walnut', 'peanut', 'cashew', 'pecan', 'hazelnut', 'pistachio'],
  'Egg-Free':       ['egg', 'mayonnaise'],
  'Shellfish-Free': ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop', 'mussel'],
  'Soy-Free':       ['soy', 'tofu', 'tempeh', 'miso', 'edamame'],
  'Fish-Free':      ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'anchovy', 'halibut', 'sardine'],
};

function parsePrepMinutes(prepTime: string): number {
  let minutes = 0;
  const hourMatch = prepTime.match(/(\d+)\s*hour/i);
  const minMatch = prepTime.match(/(\d+)\s*min/i);
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  return minutes || 999;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let _cache: Recipe[] | null = null;

async function getAllRecipes(): Promise<Recipe[]> {
  if (_cache) return _cache;
  const res = await fetch('/recipes.json');
  _cache = await res.json();
  return _cache!;
}

function applyFilters(recipes: Recipe[], query: string, filters: FilterState): Recipe[] {
  let results = recipes;

  // Chef filter
  if (filters.chef && filters.chef !== 'All Chefs') {
    const chef = filters.chef.toLowerCase();
    results = results.filter(r =>
      r.tags.some(t => t.toLowerCase().includes(chef)) ||
      r.title.toLowerCase().includes(chef)
    );
  }

  // Protein
  if (filters.meatType && filters.meatType !== 'All') {
    results = results.filter(r => r.meatType === filters.meatType);
  }

  // Spiciness
  if (filters.spiciness && filters.spiciness !== 'All') {
    results = results.filter(r => r.spiciness === filters.spiciness);
  }

  // Difficulty
  if (filters.difficulty && filters.difficulty !== 'All') {
    results = results.filter(r => r.difficulty === filters.difficulty);
  }

  // Max time
  const maxMins = MAX_TIME_MAP[filters.maxTime];
  if (maxMins) {
    results = results.filter(r => parsePrepMinutes(r.prepTime) <= maxMins);
  }

  // Allergy
  const allergyKeywords = ALLERGY_KEYWORDS[filters.allergy];
  if (allergyKeywords) {
    results = results.filter(r => {
      const ingredientText = r.ingredients.map(i => i.name).join(' ').toLowerCase();
      return !allergyKeywords.some(kw => ingredientText.includes(kw));
    });
  }

  // Text search
  const q = query.trim().toLowerCase();
  if (q) {
    results = results.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q)) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(q))
    );
  }

  return results;
}

export const getInitialRecipes = async (onUpdate: (recipes: Recipe[]) => void): Promise<void> => {
  const all = await getAllRecipes();
  onUpdate(shuffle(all).slice(0, 12));
};

export const searchRecipes = async (
  query: string,
  filters: FilterState,
  onUpdate: (recipes: Recipe[]) => void,
): Promise<void> => {
  const all = await getAllRecipes();
  const filtered = applyFilters(all, query, filters);
  onUpdate(shuffle(filtered).slice(0, 24));
};
