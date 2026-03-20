/**
 * Seeds 50 Ina Garten recipes into the database.
 * Run with: npm run db:seed:ina
 */

import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter } as any);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(prompt: string): Promise<any[]> {
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
            id:           { type: Type.STRING },
            title:        { type: Type.STRING },
            description:  { type: Type.STRING },
            meatType:     { type: Type.STRING },
            spiciness:    { type: Type.STRING, enum: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
            prepTime:     { type: Type.STRING },
            difficulty:   { type: Type.STRING, enum: ['Easy', 'Intermediate', 'Advanced'] },
            ingredients:  { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.STRING },
            tags:         { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['id', 'title', 'description', 'meatType', 'spiciness', 'prepTime', 'difficulty', 'ingredients', 'instructions', 'tags'],
        },
      },
    },
  });
  return JSON.parse(response.text ?? '[]');
}

async function storeRecipes(searchQuery: string, recipes: any[]) {
  const filtersKey = JSON.stringify({
    q: searchQuery, meat: 'All', spice: 'All', diff: 'All', time: 'All', allergy: 'No Allergy Filter',
  });

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { id: recipe.id },
      update: {},
      create: {
        id:           recipe.id,
        title:        recipe.title,
        description:  recipe.description,
        meatType:     recipe.meatType,
        spiciness:    recipe.spiciness,
        prepTime:     recipe.prepTime,
        difficulty:   recipe.difficulty,
        ingredients:  JSON.stringify(recipe.ingredients),
        instructions: recipe.instructions,
        tags:         JSON.stringify(recipe.tags),
      },
    });
  }

  const search = await prisma.search.upsert({
    where: { query_filters: { query: searchQuery, filters: filtersKey } },
    update: {},
    create: { query: searchQuery, filters: filtersKey },
  });

  for (const recipe of recipes) {
    await prisma.searchRecipe.upsert({
      where: { searchId_recipeId: { searchId: search.id, recipeId: recipe.id } },
      update: {},
      create: { searchId: search.id, recipeId: recipe.id },
    });
  }
}

// Ina Garten recipe batches — 5 batches × 10 recipes = 50 total
const BATCHES = [
  {
    query: 'ina garten',
    prompt: `Generate 10 recipes inspired by Ina Garten (the Barefoot Contessa). Focus on her classic signature dishes: roast chicken, beef tenderloin, shrimp scampi, lemon pasta, French-inspired comfort food. Her style is elegant but approachable, using high-quality simple ingredients. Use unique IDs starting with "ina_batch1_". Include a mix of difficulties and her hallmark flavors: lemon, fresh herbs, good olive oil, real butter.`,
  },
  {
    query: 'ina garten',
    prompt: `Generate 10 more recipes in Ina Garten's Barefoot Contessa style. Focus on her beloved side dishes and salads: roasted vegetables, potato dishes, grain salads, her famous Parker House rolls, coleslaw. Her approach: simple techniques, quality ingredients, generous portions. Use unique IDs starting with "ina_batch2_". Mix of Vegetarian and meat-based dishes, all Mild spiciness, Easy to Intermediate difficulty.`,
  },
  {
    query: 'ina garten',
    prompt: `Generate 10 Ina Garten-inspired soup and stew recipes. Think her classic tomato soup, French onion, seafood chowder, chicken pot pie filling, beef stew with good red wine. Her soups are rich, deeply flavored, often finished with cream or good parmesan. Use unique IDs starting with "ina_batch3_". All Mild spiciness, mix of difficulties.`,
  },
  {
    query: 'ina garten',
    prompt: `Generate 10 Ina Garten-inspired pasta and seafood recipes. Her beloved pasta dishes: linguine with shrimp scampi, pasta with pesto, baked ziti, seafood pasta. Seafood: roasted salmon, shrimp cocktail, lobster mac and cheese. Quality ingredients, French and Italian influences. Use unique IDs starting with "ina_batch4_". Mix of Seafood and Vegetarian meatType, Mild spiciness.`,
  },
  {
    query: 'ina garten',
    prompt: `Generate 10 Ina Garten-inspired entertaining and weeknight dinner recipes: roasted rack of lamb, coq au vin, chicken marsala, beef bourguignon, elegant dinner party dishes she'd serve in the Hamptons. Simple enough for weeknights, special enough for guests. Use unique IDs starting with "ina_batch5_". Mix of Chicken, Beef, Lamb meatType, Mild to Medium spiciness, Intermediate to Advanced difficulty.`,
  },
];

async function main() {
  const before = await prisma.recipe.count();
  console.log(`\n👩‍🍳 Seeding Ina Garten recipes (${before} recipes currently in DB)\n`);

  let totalAdded = 0;

  for (let i = 0; i < BATCHES.length; i++) {
    const { query, prompt } = BATCHES[i];
    process.stdout.write(`  ⏳  Batch ${i + 1}/5 … `);
    try {
      const recipes = await callGemini(prompt);
      await storeRecipes(query, recipes);
      console.log(`✓ (${recipes.length} recipes)`);
      totalAdded += recipes.length;
    } catch (err: any) {
      console.log(`✗ ${err.message}`);
    }
    if (i < BATCHES.length - 1) await sleep(2000);
  }

  const after = await prisma.recipe.count();
  console.log(`\n✅ Done — added ${after - before} new recipes (${after} total)\n`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
