import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

function parseRecipe(r: any) {
  const rawIngredients = JSON.parse(r.ingredients);
  const ingredients = Array.isArray(rawIngredients) && typeof rawIngredients[0] === 'string'
    ? (rawIngredients as string[]).map(s => {
        const match = s.match(/^([\d\/\s\w.,-]+(?:cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice|piece|can|bunch|pinch|handful|dash|sprig|head|stalk|medium|large|small|whole|to taste)[s]?\.?\s+)?(.+)$/i);
        return match
          ? { amount: (match[1] || '').trim(), name: match[2].trim() }
          : { amount: '', name: s };
      })
    : rawIngredients;
  return { ...r, ingredients, tags: JSON.parse(r.tags) };
}

function parsePrepMinutes(prepTime: string): number {
  let minutes = 0;
  const hourMatch = prepTime.match(/(\d+)\s*hour/i);
  const minMatch = prepTime.match(/(\d+)\s*min/i);
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  return minutes || 999;
}

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

// GET /api/recipes?query=...&meatType=...&spiciness=...&difficulty=...&maxTime=...&allergy=...&chef=...
router.get('/', async (req: Request, res: Response) => {
  let { query = '', ...filters } = req.query as Record<string, string>;

  if (filters.chef && filters.chef !== 'All Chefs') {
    query = filters.chef.toLowerCase();
    filters = { meatType: 'All', spiciness: 'All', difficulty: 'All', maxTime: 'All', allergy: 'No Allergy Filter' };
  }

  try {
    const where: any = {};

    if (filters.meatType && filters.meatType !== 'All') where.meatType = filters.meatType;
    if (filters.spiciness && filters.spiciness !== 'All') where.spiciness = filters.spiciness;
    if (filters.difficulty && filters.difficulty !== 'All') where.difficulty = filters.difficulty;

    const searchQuery = query === '__initial__' ? '' : query.trim();
    if (searchQuery) {
      where.OR = [
        { title:       { contains: searchQuery } },
        { description: { contains: searchQuery } },
        { tags:        { contains: searchQuery } },
        { ingredients: { contains: searchQuery } },
      ];
    }

    let recipes = await prisma.recipe.findMany({ where });

    // MaxTime: parse prepTime string in-memory
    const maxMins = MAX_TIME_MAP[filters.maxTime];
    if (maxMins) {
      recipes = recipes.filter(r => parsePrepMinutes(r.prepTime) <= maxMins);
    }

    // Allergy: check against ingredient names in-memory
    const allergyKeywords = ALLERGY_KEYWORDS[filters.allergy];
    if (allergyKeywords) {
      recipes = recipes.filter(r =>
        !allergyKeywords.some(kw => r.ingredients.toLowerCase().includes(kw))
      );
    }

    // Shuffle for variety on every request
    recipes = recipes.sort(() => Math.random() - 0.5);

    const limit = query === '__initial__' ? 12 : 8;
    return res.json(recipes.slice(0, limit).map(parseRecipe));
  } catch (err: any) {
    console.error('[recipes]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
