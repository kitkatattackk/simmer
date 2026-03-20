import { Recipe, FilterState } from '../types';

const CACHE_KEY = 'recipeCache';
const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  recipes: Recipe[];
  timestamp: number;
}

function buildKey(query: string, filters: FilterState): string {
  return JSON.stringify({
    q: query.trim().toLowerCase(),
    meat: filters.meatType,
    spice: filters.spiciness,
    diff: filters.difficulty,
    time: filters.maxTime,
    allergy: filters.allergy,
  });
}

function read(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function write(cache: Record<string, CacheEntry>): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

export function getCached(query: string, filters: FilterState): Recipe[] | null {
  const cache = read();
  const entry = cache[buildKey(query, filters)];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    delete cache[buildKey(query, filters)];
    write(cache);
    return null;
  }
  return entry.recipes;
}

export function setCached(query: string, filters: FilterState, recipes: Recipe[]): void {
  const cache = read();
  cache[buildKey(query, filters)] = { recipes, timestamp: Date.now() };
  write(cache);
}

export const INITIAL_CACHE_QUERY = '__initial__';
export const BLANK_FILTERS: FilterState = {
  meatType: 'All', spiciness: 'All', difficulty: 'All',
  maxTime: 'All', searchQuery: '', allergy: 'No Allergy Filter',
};
