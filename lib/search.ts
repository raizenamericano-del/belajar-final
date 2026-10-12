import { convert, parseMeasurement, type ExactRational, type Unit } from "@/lib/conversion";
import { PRODUCTS_DATA, type Product } from "@/lib/data";

export type QuickConversion = { value: number; from: Unit; to: Unit; result: number; source: string; exactValue: ExactRational | null };
const FIRST_MEASUREMENT = /((?:\d+\s*[- ]\s*\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?|[¼½¾⅛⅜⅝⅞⅓⅔]))\s*(inch|inches|inci|in|mm|cm|ft|feet|foot|kaki|meter|meters|m|["″′'])?/i;

function extractFirstMeasurement(query: string): { text: string; unit?: string } | null {
  const match = query.match(FIRST_MEASUREMENT);
  if (!match) return null;
  return { text: `${match[1]}${match[2] ? ` ${match[2]}` : ""}`, unit: match[2] };
}

export function detectQuickConversion(query: string): QuickConversion | null {
  const q = query.trim();
  if (!q) return null;
  const match = extractFirstMeasurement(q);
  if (!match) return null;
  const numericOnly = /^[\d\s.,/\-¼½¾⅛⅜⅝⅞⅓⅔]+$/.test(q);
  const hasUnitOrConversionCue = /\b(inch(?:es)?|inci|\bin\b|mm|cm|ft|feet|foot|kaki|meter|\bke\b|\bberapa\b|convert|konversi)\b|["″′]/i.test(q);
  if (!numericOnly && !hasUnitOrConversionCue) return null;
  const parsed = parseMeasurement(match.text, "in");
  if (!parsed) return null;
  const lower = q.toLowerCase();
  const target: Unit = /\bke\s*(?:inch|inci|in)\b|\bberapa\s*(?:inch|inci|in)\b/i.test(lower)
    ? "in"
    : /\bke\s*mm\b|\bberapa\s*mm\b/i.test(lower) ? "mm"
      : /\bke\s*cm\b|\bberapa\s*cm\b/i.test(lower) ? "cm"
        : parsed.unit === "in" || parsed.unit === "ft" ? "cm" : "in";
  return { value: parsed.value, from: parsed.unit, to: target, result: convert(parsed.value, parsed.unit, target), source: match.text, exactValue: parsed.exactValue };
}

const normalize = (value: string) => value
  .toLocaleLowerCase("id-ID")
  .replace(/[×✕]/g, "x")
  .replace(/[″”]/g, '"')
  .replace(/[’′]/g, "'")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export function searchProducts(query: string, products: Product[] = PRODUCTS_DATA): Product[] {
  const q = normalize(query);
  if (!q) return products;
  const compact = q.replace(/\s/g, "");
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = products.map((product) => {
    const haystack = normalize([
      product.name, product.code, product.categoryId, product.subcategory, product.description,
      ...product.aliases, product.diameterCode ?? "", product.lengthIn ? String(product.lengthIn) : "",
      product.nominalDiameterMm ? `${product.nominalDiameterMm} mm` : "",
    ].join(" "));
    const compactHaystack = haystack.replace(/\s/g, "");
    let score = 0;
    if (haystack === q) score += 100;
    if (haystack.includes(q)) score += 35;
    if (compact && compactHaystack.includes(compact)) score += 25;
    const hits = tokens.filter((token) => haystack.includes(token) || compactHaystack.includes(token.replace(/\s/g, ""))).length;
    score += hits * 5;
    if (tokens[0] && product.name.toLocaleLowerCase("id-ID").includes(tokens[0])) score += 4;
    return { product, score };
  }).filter((item) => item.score > 0);
  return scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "id")).map(({ product }) => product);
}
