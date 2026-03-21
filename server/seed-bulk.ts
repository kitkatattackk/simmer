/**
 * Bulk seed — generates 300+ diverse recipes across cuisines, proteins,
 * spice levels, and difficulties, then stores them in the DB.
 * Gemini is called once here; after this the app never needs it again.
 *
 * Run with:  npx tsx server/seed-bulk.ts
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

const INGREDIENT_ITEM = {
  type: Type.OBJECT,
  properties: {
    name:   { type: Type.STRING },
    amount: { type: Type.STRING },
  },
  required: ['name', 'amount'],
};

const RECIPE_SCHEMA = {
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
      ingredients:  { type: Type.ARRAY, items: INGREDIENT_ITEM },
      instructions: { type: Type.STRING },
      tags:         { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['id', 'title', 'description', 'meatType', 'spiciness', 'prepTime', 'difficulty', 'ingredients', 'instructions', 'tags'],
  },
};

async function callGemini(prompt: string): Promise<any[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json', responseSchema: RECIPE_SCHEMA },
  });
  return JSON.parse(response.text ?? '[]');
}

async function store(recipes: any[]) {
  let added = 0;
  for (const r of recipes) {
    const existing = await prisma.recipe.findUnique({ where: { id: r.id } });
    if (existing) continue;
    await prisma.recipe.create({
      data: {
        id:           r.id,
        title:        r.title,
        description:  r.description,
        meatType:     r.meatType,
        spiciness:    r.spiciness,
        prepTime:     r.prepTime,
        difficulty:   r.difficulty,
        ingredients:  JSON.stringify(r.ingredients),
        instructions: r.instructions,
        tags:         JSON.stringify(r.tags),
      },
    });
    added++;
  }
  return added;
}

async function batch(label: string, prompt: string) {
  process.stdout.write(`  ⏳  ${label} … `);
  try {
    const recipes = await callGemini(prompt);
    const added = await store(recipes);
    console.log(`✓ ${recipes.length} generated, ${added} new`);
  } catch (err: any) {
    console.log(`✗ ${err.message}`);
  }
  await sleep(2000);
}

const BATCHES: [string, string][] = [
  // ── Core diversity ────────────────────────────────────────────────────────
  ['Diverse mix A', 'Generate 12 diverse and creative recipes. Mix of Chicken, Beef, Seafood, and Vegetarian. Mix of Easy/Intermediate difficulty and Mild/Medium spice. Cover Asian, Mediterranean, Mexican, and American cuisines.'],
  ['Diverse mix B', 'Generate 12 diverse recipes covering Pork, Lamb, and Vegetarian proteins. Include dishes from Italian, Indian, Middle Eastern, and Thai cuisines. Mix of all spice levels and difficulties.'],
  ['Diverse mix C', 'Generate 12 unique and delicious recipes. Focus on comfort food classics from different cultures — French, Korean, Japanese, Greek, and American Southern. Mix proteins and spice levels.'],

  // ── By protein ────────────────────────────────────────────────────────────
  ['Chicken — Easy/Mild',       'Generate 10 easy, mild chicken recipes. Quick weeknight dinners. Cuisines: Italian, American, Mediterranean.'],
  ['Chicken — Medium/Hot',      'Generate 10 chicken recipes with medium to hot spice levels. Include Korean fried chicken, Nashville hot, Thai basil, Buffalo wings, and similar crowd-pleasers.'],
  ['Chicken — Intermediate',    'Generate 10 intermediate-difficulty chicken recipes. Include roasts, braises, stuffed dishes, and restaurant-style techniques.'],
  ['Chicken — Advanced',        'Generate 8 advanced chicken recipes requiring chef-level skill. Confit, ballotine, complex sauces, multi-component dishes.'],

  ['Beef — Easy',               'Generate 10 easy beef recipes. Burgers, stir-fries, simple steaks, tacos. Quick and satisfying.'],
  ['Beef — Intermediate',       'Generate 10 intermediate beef recipes. Braised short ribs, beef bourguignon, Korean bulgogi, smash burgers, carne asada.'],
  ['Beef — Advanced/Spicy',     'Generate 8 advanced beef recipes. Include Beef Wellington, dry-aged preparations, complex braises, and some with hot spice levels.'],

  ['Pork — All styles',         'Generate 10 diverse pork recipes across Easy/Intermediate/Advanced difficulty. Pulled pork, pork belly, carnitas, tonkatsu, schnitzel, char siu, ribs.'],
  ['Pork — Quick meals',        'Generate 8 quick pork recipes ready in under 30 minutes. Stir-fries, chops, sausage dishes, tacos.'],

  ['Seafood — Mild/Easy',       'Generate 10 easy, mild seafood recipes. Lemon butter fish, shrimp scampi, fish tacos, simple salmon, garlic prawns.'],
  ['Seafood — Bold flavors',    'Generate 10 seafood recipes with bold, complex flavors. Spicy miso salmon, Thai fish curry, Cajun shrimp, cioppino, bouillabaisse.'],
  ['Seafood — Sushi/Japanese',  'Generate 8 Japanese-inspired seafood recipes. Miso-glazed cod, teriyaki salmon, sashimi salad, temaki, oysters.'],

  ['Vegetarian — Easy',         'Generate 10 easy vegetarian recipes. Pasta dishes, salads, grain bowls, simple curries, quesadillas.'],
  ['Vegetarian — Hearty',       'Generate 10 hearty, satisfying vegetarian recipes that meat-eaters will love. Mushroom bourguignon, lentil bolognese, eggplant parmigiana, jackfruit tacos, black bean enchiladas.'],
  ['Vegetarian — Global',       'Generate 10 globally-inspired vegetarian recipes. Indian dal, Thai green curry, Lebanese fattoush, Japanese ramen, Mexican pozole verde, Moroccan tagine.'],

  ['Lamb — All styles',         'Generate 10 lamb recipes from around the world. Lamb chops, moussaka, souvlaki, lamb korma, Moroccan tagine, shepherd\'s pie, kebabs.'],

  // ── By cuisine ────────────────────────────────────────────────────────────
  ['Italian classics',          'Generate 10 classic Italian recipes. Pasta, risotto, osso buco, saltimbocca, tiramisu-inspired mains. Authentic techniques and ingredients.'],
  ['Mexican street food',       'Generate 10 Mexican and Tex-Mex recipes. Tacos al pastor, enchiladas verdes, tamales, pozole, chiles rellenos, elote.'],
  ['Indian cuisine',            'Generate 10 Indian recipes spanning North and South India. Butter chicken, biryani, dal makhani, dosas, tikka masala, vindaloo, palak paneer.'],
  ['Thai cuisine',              'Generate 10 Thai recipes. Pad thai, green curry, massaman curry, som tam, larb, tom yum, mango sticky rice inspired dishes.'],
  ['Japanese cuisine',          'Generate 10 Japanese recipes. Ramen, tonkatsu, yakitori, teriyaki, gyoza, karaage, katsudon, miso-based dishes.'],
  ['Korean cuisine',            'Generate 10 Korean recipes. Bibimbap, bulgogi, kimchi jjigae, japchae, Korean fried chicken, doenjang jjigae, galbi.'],
  ['Mediterranean',             'Generate 10 Mediterranean recipes from Greece, Turkey, Lebanon, and Spain. Spanakopita, shawarma, hummus dishes, paella, fattoush, grilled octopus.'],
  ['Chinese cuisine',           'Generate 10 Chinese recipes. Kung pao chicken, mapo tofu, char siu pork, Peking duck inspired dishes, fried rice, dumplings, sweet and sour.'],
  ['American comfort',          'Generate 10 American comfort food recipes. Mac and cheese, fried chicken, BBQ ribs, clam chowder, biscuits and gravy, meatloaf, pot roast.'],
  ['French classics',           'Generate 8 French recipes. Coq au vin, ratatouille, bouillabaisse, duck confit, steak frites, croque monsieur, French onion soup.'],
  ['Middle Eastern',            'Generate 10 Middle Eastern recipes. Shawarma, falafel, kofta, mansaf, mujaddara, kibbeh, za\'atar chicken, Persian stew.'],
  ['Latin American',            'Generate 10 Latin American recipes beyond Mexico. Peruvian ceviche, Argentinian asado, Brazilian churrasco, Cuban ropa vieja, Colombian ajiaco.'],

  // ── By spice level ────────────────────────────────────────────────────────
  ['Hot & spicy',               'Generate 12 genuinely hot recipes for spice lovers. Include Ghost pepper dishes, Nashville hot, Sichuan mala, Korean buldak, jerk chicken, vindaloo, and similar. Spiciness field must be "Hot" or "Extra Hot".'],
  ['Extra Hot',                 'Generate 8 extremely spicy recipes for serious chili heads. Use carolina reaper, habanero, ghost pepper, scotch bonnet. Make them legitimately Extra Hot.'],
  ['Mild and family-friendly',  'Generate 10 mild, family-friendly recipes with comforting flavors and no heat. Great for kids and spice-sensitive eaters.'],

  // ── Quick meals ────────────────────────────────────────────────────────────
  ['Under 15 minutes',          'Generate 10 recipes that can be fully prepared AND cooked in under 15 minutes. prepTime must be 15 minutes or less. Focus on stir-fries, eggs, salads, wraps, quesadillas.'],
  ['Under 30 minutes',          'Generate 10 recipes ready in under 30 minutes. prepTime must be 30 minutes or less. Weeknight dinners, quick pastas, stir-fries, simple grills.'],

  // ── Dietary ───────────────────────────────────────────────────────────────
  ['Gluten-Free',               'Generate 10 gluten-free recipes. MUST contain zero wheat, flour, gluten, barley, rye, regular soy sauce, or bread. Use tamari instead of soy sauce. Naturally gluten-free dishes.'],
  ['Dairy-Free',                'Generate 10 dairy-free recipes. MUST contain zero milk, cream, butter, cheese, or yogurt. Naturally dairy-free or use alternatives.'],
  ['Vegan',                     'Generate 10 fully vegan recipes. No meat, no seafood, no dairy, no eggs. Creative, satisfying plant-based cooking.'],
  ['High Protein',              'Generate 10 high-protein recipes for fitness enthusiasts. Lean proteins, legumes, eggs. Include macros context in descriptions.'],
  ['Low Carb / Keto',           'Generate 10 low-carb or keto-friendly recipes. No pasta, bread, rice, or sugar. Focus on proteins, vegetables, healthy fats.'],

  // ── Occasion ──────────────────────────────────────────────────────────────
  ['Date night dinners',        'Generate 10 impressive date-night recipes that feel special. Elegant but not overly complex. Surf and turf, risotto, duck, lobster bisque, etc.'],
  ['Meal prep & batch cooking', 'Generate 10 recipes ideal for meal prepping. Make large batches, store well, reheat beautifully. Grain bowls, soups, curries, roasted proteins.'],
  ['BBQ & grilling',            'Generate 10 BBQ and grilling recipes. Burgers, ribs, grilled fish, corn, skewers, smoked brisket, grilled vegetables.'],
  ['Soups & stews',             'Generate 10 hearty soups and stews. Chicken noodle, beef stew, pho, gumbo, minestrone, lentil soup, chili, ramen broth dishes.'],
  ['Breakfast & brunch',        'Generate 10 savory breakfast and brunch recipes. Eggs benedict, shakshuka, frittatas, breakfast burritos, smoked salmon bagels. meatType should reflect the protein used.'],
];

async function main() {
  const before = await prisma.recipe.count();
  console.log(`\n🌱 Bulk seed starting — ${before} recipes currently in DB`);
  console.log(`   Running ${BATCHES.length} batches…\n`);

  for (const [label, prompt] of BATCHES) {
    await batch(label, prompt);
  }

  const after = await prisma.recipe.count();
  console.log(`\n✅ Done! ${after} total recipes (+${after - before} new)\n`);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
