/**
 * Seed script — preloads the recipe database with recipes for every
 * filter combination so the app rarely needs to call Gemini at runtime.
 *
 * Run with:  npm run db:seed
 */

import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter } as any);

// ─── Filter values (keep in sync with FilterBar.tsx) ─────────────────────────

const MEAT_TYPES   = ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Lamb'];
const SPICINESS    = ['Mild', 'Medium', 'Hot', 'Extra Hot'];
const DIFFICULTIES = ['Easy', 'Intermediate', 'Advanced'];
const TIME_FILTERS = ['Under 15 mins', 'Under 30 mins', 'Under 60 mins'];
const ALLERGIES    = ['Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Egg-Free', 'Shellfish-Free', 'Soy-Free', 'Fish-Free'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildFilterKey(query: string, filters: Record<string, string>): string {
  return JSON.stringify({
    q: query.trim().toLowerCase(),
    meat:   filters.meatType   ?? 'All',
    spice:  filters.spiciness  ?? 'All',
    diff:   filters.difficulty ?? 'All',
    time:   filters.maxTime    ?? 'All',
    allergy: filters.allergy   ?? 'No Allergy Filter',
  });
}

async function alreadySeeded(query: string, filters: Record<string, string>): Promise<boolean> {
  const key = buildFilterKey(query, filters);
  const existing = await prisma.search.findUnique({
    where: { query_filters: { query: query.trim().toLowerCase(), filters: key } },
    include: { recipes: true },
  });
  return !!(existing && existing.recipes.length > 0);
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

async function storeRecipes(query: string, filters: Record<string, string>, recipes: any[]) {
  const filtersKey = buildFilterKey(query, filters);
  const normalizedQuery = query.trim().toLowerCase();

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
    where: { query_filters: { query: normalizedQuery, filters: filtersKey } },
    update: {},
    create: { query: normalizedQuery, filters: filtersKey },
  });

  for (const recipe of recipes) {
    await prisma.searchRecipe.upsert({
      where: { searchId_recipeId: { searchId: search.id, recipeId: recipe.id } },
      update: {},
      create: { searchId: search.id, recipeId: recipe.id },
    });
  }
}

async function seed(label: string, prompt: string, query: string, filters: Record<string, string>) {
  if (await alreadySeeded(query, filters)) {
    console.log(`  ⏭  skip  ${label}`);
    return;
  }
  try {
    process.stdout.write(`  ⏳  ${label} … `);
    const recipes = await callGemini(prompt);
    await storeRecipes(query, filters, recipes);
    console.log(`✓ (${recipes.length} recipes)`);
  } catch (err: any) {
    console.log(`✗ ${err.message}`);
  }
  await sleep(1500); // stay under Gemini rate limits
}

// ─── Seed jobs ────────────────────────────────────────────────────────────────

const BLANK = { meatType: 'All', spiciness: 'All', difficulty: 'All', maxTime: 'All', allergy: 'No Allergy Filter' };

async function main() {
  const before = await prisma.recipe.count();
  console.log(`\n🌱 Starting seed  (${before} recipes already in DB)\n`);

  // 1. Initial diverse load
  await seed(
    'Initial diverse load',
    'Generate 20 diverse and delicious recipe ideas. Include a wide mix of cuisines, meat types (Chicken, Beef, Pork, Seafood, Vegetarian, Lamb), spiciness levels, and difficulties. Make them sound appetizing and creative.',
    '__initial__',
    BLANK,
  );

  // 2. Per meat type
  console.log('\n── Meat types ──');
  for (const meat of MEAT_TYPES) {
    await seed(
      meat,
      `Generate 10 varied and delicious ${meat} recipes. Include a mix of spiciness levels (Mild to Hot) and difficulty levels (Easy to Advanced). Make them diverse in cuisine and cooking style.`,
      '',
      { ...BLANK, meatType: meat },
    );
  }

  // 3. Per spiciness
  console.log('\n── Spiciness levels ──');
  for (const spice of SPICINESS) {
    await seed(
      spice,
      `Generate 8 delicious recipes that are ${spice} in heat/spiciness. Include a mix of meat types and cuisines. All recipes MUST be ${spice} — not hotter, not milder.`,
      '',
      { ...BLANK, spiciness: spice },
    );
  }

  // 4. Per difficulty
  console.log('\n── Difficulty levels ──');
  for (const diff of DIFFICULTIES) {
    await seed(
      diff,
      `Generate 8 delicious ${diff} recipes. These should genuinely match the ${diff} skill level. Include a mix of cuisines and meat types.`,
      '',
      { ...BLANK, difficulty: diff },
    );
  }

  // 5. Per time filter
  console.log('\n── Time filters ──');
  for (const time of TIME_FILTERS) {
    const mins = time.replace('Under ', '').replace(' mins', '');
    await seed(
      time,
      `Generate 8 delicious recipes that can be fully prepared and cooked in under ${mins} minutes. The prepTime field MUST reflect this constraint. Include a mix of cuisines and meat types.`,
      '',
      { ...BLANK, maxTime: time },
    );
  }

  // 6. Per allergy
  console.log('\n── Dietary / allergy filters ──');
  for (const allergy of ALLERGIES) {
    const ingredient = allergy.replace('-Free', '').toLowerCase();
    await seed(
      allergy,
      `Generate 8 diverse and delicious recipes that are strictly ${allergy}. Every single ingredient MUST be free from ${ingredient}. Include a mix of cuisines, protein types, and difficulty levels.`,
      '',
      { ...BLANK, allergy },
    );
  }

  const after = await prisma.recipe.count();
  const searches = await prisma.search.count();
  console.log(`\n✅ Seed complete — ${after} recipes, ${searches} cached searches (added ${after - before} new recipes)\n`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
