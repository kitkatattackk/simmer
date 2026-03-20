import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, FilterState } from "../types";
import { DUMMY_RECIPES } from "./dummyData";
import { getCached, setCached, INITIAL_CACHE_QUERY, BLANK_FILTERS } from "./cacheService";

const USE_DUMMY_DATA = true;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateRecipes = async (
  prompt: string,
  onUpdate: (recipes: Recipe[]) => void,
): Promise<void> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
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

  let recipes: any[];
  try {
    recipes = JSON.parse(response.text || '[]');
  } catch (e) {
    throw new Error(`Failed to parse model response: ${response.text?.slice(0, 200)}`);
  }
  if (!recipes.length) throw new Error('Model returned 0 recipes. Response: ' + response.text?.slice(0, 200));

  onUpdate(recipes);
};

export const getInitialRecipes = async (onUpdate: (recipes: Recipe[]) => void): Promise<void> => {
  if (USE_DUMMY_DATA) { onUpdate(DUMMY_RECIPES); return; }
  const cached = getCached(INITIAL_CACHE_QUERY, BLANK_FILTERS);
  if (cached) { onUpdate(cached); return; }
  const prompt = "Generate 12 diverse and delicious recipe ideas. Include a mix of meat types (Chicken, Beef, Pork, Seafood, Vegetarian) and spiciness levels. Make them sound appetizing and creative.";
  return generateRecipes(prompt, (recipes) => {
    setCached(INITIAL_CACHE_QUERY, BLANK_FILTERS, recipes);
    onUpdate(recipes);
  });
};

export const searchRecipes = async (query: string, filters: FilterState, onUpdate: (recipes: Recipe[]) => void): Promise<void> => {
  if (USE_DUMMY_DATA) { onUpdate(DUMMY_RECIPES); return; }
  const cached = getCached(query, filters);
  if (cached) { onUpdate(cached); return; }
  const filterDesc = Object.entries(filters)
    .filter(([k, v]) => v && v !== 'All' && v !== 'None' && k !== 'searchQuery' && k !== 'allergy')
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const allergyClause = filters.allergy && filters.allergy !== 'No Allergy Filter'
    ? ` All recipes MUST be strictly ${filters.allergy} — exclude any ingredients that contain or may contain ${filters.allergy.replace('-Free', '').toLowerCase()}.`
    : '';

  const searchClause = query.trim()
    ? `matching the following search: "${query}"`
    : 'that are diverse and delicious';

  const prompt = `Generate 8 recipes ${searchClause}. ${filterDesc ? `Strictly apply these filters: ${filterDesc}.` : ''}${allergyClause} Ensure variety and high quality. If "maxTime" is specified, ensure the prepTime is within that limit.`;
  return generateRecipes(prompt, (recipes) => {
    setCached(query, filters, recipes);
    onUpdate(recipes);
  });
};
