/**
 * Exports all recipes from SQLite to public/recipes.json
 * Run with: npx tsx server/export-recipes.ts
 */
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client.ts';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' });
const prisma = new PrismaClient({ adapter } as any);

function parseRecipe(r: any) {
  const rawIngredients = JSON.parse(r.ingredients);
  const ingredients = Array.isArray(rawIngredients) && typeof rawIngredients[0] === 'string'
    ? (rawIngredients as string[]).map((s: string) => {
        const match = s.match(/^([\d\/\s\w.,-]+(?:cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice|piece|can|bunch|pinch|handful|dash|sprig|head|stalk|medium|large|small|whole|to taste)[s]?\.?\s+)?(.+)$/i);
        return match ? { amount: (match[1] || '').trim(), name: match[2].trim() } : { amount: '', name: s };
      })
    : rawIngredients;
  return { ...r, ingredients, tags: JSON.parse(r.tags) };
}

const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: 'asc' } });
const parsed = recipes.map(parseRecipe);

writeFileSync('public/recipes.json', JSON.stringify(parsed, null, 2));
console.log(`✅ Exported ${parsed.length} recipes to public/recipes.json`);
await prisma.$disconnect();
