import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from '../db';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

function buildFilterKey(query: string, filters: Record<string, string>): string {
  return JSON.stringify({
    q: query.trim().toLowerCase(),
    meat: filters.meatType ?? 'All',
    spice: filters.spiciness ?? 'All',
    diff: filters.difficulty ?? 'All',
    time: filters.maxTime ?? 'All',
    allergy: filters.allergy ?? 'No Allergy Filter',
  });
}

function parseRecipe(r: any) {
  return {
    ...r,
    ingredients: JSON.parse(r.ingredients),
    tags: JSON.parse(r.tags),
  };
}

async function callGemini(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            meatType: { type: Type.STRING },
            spiciness: { type: Type.STRING, enum: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
            prepTime: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Easy', 'Intermediate', 'Advanced'] },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['id', 'title', 'description', 'meatType', 'spiciness', 'prepTime', 'difficulty', 'ingredients', 'instructions', 'tags'],
        },
      },
    },
  });
  return JSON.parse(response.text ?? '[]');
}

async function storeRecipesForSearch(
  query: string,
  filtersKey: string,
  recipes: any[],
) {
  // Upsert each recipe (Gemini may re-generate ones we already have)
  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { id: recipe.id },
      update: {},
      create: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        meatType: recipe.meatType,
        spiciness: recipe.spiciness,
        prepTime: recipe.prepTime,
        difficulty: recipe.difficulty,
        ingredients: JSON.stringify(recipe.ingredients),
        instructions: recipe.instructions,
        tags: JSON.stringify(recipe.tags),
      },
    });
  }

  // Create the search record and link recipes
  const search = await prisma.search.upsert({
    where: { query_filters: { query, filters: filtersKey } },
    update: {},
    create: { query, filters: filtersKey },
  });

  for (const recipe of recipes) {
    await prisma.searchRecipe.upsert({
      where: { searchId_recipeId: { searchId: search.id, recipeId: recipe.id } },
      update: {},
      create: { searchId: search.id, recipeId: recipe.id },
    });
  }
}

// GET /api/recipes?query=...&meatType=...&spiciness=...&difficulty=...&maxTime=...&allergy=...&chef=...
router.get('/', async (req: Request, res: Response) => {
  let { query = '', ...filters } = req.query as Record<string, string>;

  // Chef filter overrides query — look up pre-seeded chef recipes
  if (filters.chef && filters.chef !== 'All Chefs') {
    query = filters.chef.toLowerCase();
    filters = { meatType: 'All', spiciness: 'All', difficulty: 'All', maxTime: 'All', allergy: 'No Allergy Filter' };
  }

  const filtersKey = buildFilterKey(query, filters);

  try {
    // 1. Check DB for this exact search
    const cached = await prisma.search.findUnique({
      where: { query_filters: { query: query.trim().toLowerCase(), filters: filtersKey } },
      include: { recipes: { include: { recipe: true } } },
    });

    if (cached && cached.recipes.length > 0) {
      return res.json(cached.recipes.map(sr => parseRecipe(sr.recipe)));
    }

    // 2. Cache miss — call Gemini
    const filterDesc = Object.entries(filters)
      .filter(([k, v]) => v && v !== 'All' && v !== 'None' && v !== 'No Allergy Filter')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const allergyClause = filters.allergy && filters.allergy !== 'No Allergy Filter'
      ? ` All recipes MUST be strictly ${filters.allergy} — exclude any ingredients that contain or may contain ${filters.allergy.replace('-Free', '').toLowerCase()}.`
      : '';

    const searchClause = query.trim()
      ? `matching the following search: "${query}"`
      : 'that are diverse and delicious';

    const isInitial = query === '__initial__';
    const prompt = isInitial
      ? 'Generate 12 diverse and delicious recipe ideas. Include a mix of meat types (Chicken, Beef, Pork, Seafood, Vegetarian) and spiciness levels. Make them sound appetizing and creative.'
      : `Generate 8 recipes ${searchClause}. ${filterDesc ? `Strictly apply these filters: ${filterDesc}.` : ''}${allergyClause} Ensure variety and high quality. If "maxTime" is specified, ensure the prepTime is within that limit.`;

    const recipes = await callGemini(prompt);
    await storeRecipesForSearch(query.trim().toLowerCase(), filtersKey, recipes);

    return res.json(recipes);
  } catch (err: any) {
    console.error('[recipes]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
