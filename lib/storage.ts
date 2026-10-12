import { loadProgress, type UserProgress } from "@/lib/progress";

export type ConversionHistoryEntry = { id: string; input: string; from: string; to: string; result: string; timestamp: number };
const storageKey = (name: string) => `kayu.${name}`;

export function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey(key)) ?? "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch { return []; }
}

export function writeList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(storageKey(key), JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
}

export function addFavorite(id: string): string[] {
  const ids = readList<string>("favorites");
  const next = ids.includes(id) ? ids : [...ids, id];
  writeList("favorites", next);
  return next;
}

export function removeFavorite(id: string): string[] {
  const next = readList<string>("favorites").filter((item) => item !== id);
  writeList("favorites", next);
  return next;
}

export function pushHistory(entry: Omit<ConversionHistoryEntry, "id" | "timestamp">): ConversionHistoryEntry[] {
  const current = readList<ConversionHistoryEntry>("conversionHistory");
  const item = { ...entry, id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, timestamp: Date.now() };
  const next = [item, ...current].slice(0, 50);
  writeList("conversionHistory", next);
  return next;
}

export function pushSearch(query: string): string[] {
  const normalized = query.trim();
  if (!normalized) return readList<string>("searchHistory");
  const next = [normalized, ...readList<string>("searchHistory").filter((value) => value.toLowerCase() !== normalized.toLowerCase())].slice(0, 12);
  writeList("searchHistory", next);
  return next;
}

export function readProgress(): UserProgress {
  return loadProgress(typeof window === "undefined" ? undefined : window.localStorage);
}
