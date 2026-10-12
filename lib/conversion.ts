export type Unit = "in" | "ft" | "m" | "cm" | "mm";
export type ConversionMode = "easy" | "shop" | "accurate";

export const UNIT_LABELS: Record<Unit, string> = {
  in: "inci",
  ft: "kaki (ft)",
  m: "meter",
  cm: "cm",
  mm: "mm",
};

/** Exact base factors, expressed as millimetres. */
export const TO_MM: Record<Unit, number> = {
  in: 25.4,
  ft: 304.8,
  m: 1000,
  cm: 10,
  mm: 1,
};

const UNIT_SUFFIXES: Array<[RegExp, Unit]> = [
  [/\s*(?:millimeters?|millimetre|milimeter|milimetre|mm)\s*$/i, "mm"],
  [/\s*(?:centimeters?|centimetre|sentimeter|cm)\s*$/i, "cm"],
  [/\s*(?:inches?|inch|in)\s*$/i, "in"],
  [/\s*["″]\s*$/, "in"],
  [/\s*(?:feet|foot|ft|kaki|['′])\s*$/i, "ft"],
  [/\s*(?:meters?|metre|meter|m)\s*$/i, "m"],
];

const UNICODE_FRACTIONS: Record<string, string> = {
  "⅛": "1/8", "¼": "1/4", "⅜": "3/8", "½": "1/2", "⅝": "5/8", "¾": "3/4", "⅞": "7/8",
  "⅓": "1/3", "⅔": "2/3", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
};

export type ExactRational = { numerator: string; denominator: string };

export interface ParsedMeasurement {
  value: number;
  unit: Unit;
  expression: string;
  exactValue: ExactRational | null;
}

const UNIT_TO_MM_RATIONAL: Record<Unit, [bigint, bigint]> = {
  in: [127n, 5n], ft: [1524n, 5n], m: [1000n, 1n], cm: [10n, 1n], mm: [1n, 1n],
};

function gcd(a: bigint, b: bigint): bigint {
  let left = a < 0n ? -a : a;
  let right = b < 0n ? -b : b;
  while (right !== 0n) { const remainder = left % right; left = right; right = remainder; }
  return left || 1n;
}

function reduceRational(numerator: bigint, denominator: bigint): ExactRational {
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  const divisor = gcd(numerator, denominator);
  return { numerator: (numerator / divisor).toString(), denominator: (denominator / divisor).toString() };
}

/** Parse a non-negative decimal or fraction without losing its exact rational form. */
export function parseExactScalar(input: string): ExactRational | null {
  if (input.length > 256) return null;
  let text = input.trim().replace(/[−–]/g, "-").replace(/,/g, ".");
  for (const [glyph, fraction] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.replace(new RegExp(`(\\d)${glyph}`, "g"), `$1 ${fraction}`);
    text = text.replaceAll(glyph, fraction);
  }
  text = text.replace(/\s+/g, " ").trim();
  if (!text || text.startsWith("-")) return null;
  const mixed = text.match(/^(\d+)(?:\s+|-)(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = BigInt(mixed[1]); const numerator = BigInt(mixed[2]); const denominator = BigInt(mixed[3]);
    if (denominator === 0n || numerator >= denominator) return null;
    return reduceRational(whole * denominator + numerator, denominator);
  }
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = BigInt(fraction[2]);
    if (denominator === 0n) return null;
    return reduceRational(BigInt(fraction[1]), denominator);
  }
  const decimal = text.match(/^(\d+)(?:\.(\d+))?$/);
  if (!decimal) return null;
  const digits = decimal[2] ?? "";
  const denominator = 10n ** BigInt(digits.length);
  const numerator = BigInt(decimal[1]) * denominator + BigInt(digits || "0");
  return reduceRational(numerator, denominator);
}
function convertRational(value: ExactRational, from: Unit, to: Unit): ExactRational {
  const [fromNumerator, fromDenominator] = UNIT_TO_MM_RATIONAL[from];
  const [toNumerator, toDenominator] = UNIT_TO_MM_RATIONAL[to];
  return reduceRational(
    BigInt(value.numerator) * fromNumerator * toDenominator,
    BigInt(value.denominator) * fromDenominator * toNumerator,
  );
}

/** Render an exact terminating decimal with all needed places; recurring decimals use ≈. */
function terminatingDecimal(value: ExactRational): string | null {
  const numerator = BigInt(value.numerator); let denominator = BigInt(value.denominator);
  if (denominator <= 0n) return null;
  let twos = 0; let fives = 0;
  while (denominator % 2n === 0n) { denominator /= 2n; twos++; }
  while (denominator % 5n === 0n) { denominator /= 5n; fives++; }
  if (denominator !== 1n) return null;
  const places = Math.max(twos, fives);
  if (places > 30) return null;
  const scale = 10n ** BigInt(places);
  const scaled = numerator * scale / BigInt(value.denominator);
  const whole = scaled / scale;
  const fraction = places ? (scaled % scale).toString().padStart(places, "0").replace(/0+$/, "") : "";
  return fraction ? `${whole},${fraction}` : whole.toString();
}

export function formatConvertedValue(value: number, from: Unit, to: Unit, exactValue?: ExactRational | null): { text: string; symbol: "≈" | "=" } {
  const source = exactValue ?? parseExactScalar(String(value));
  if (source) {
    const converted = convertRational(source, from, to);
    const exactText = terminatingDecimal(converted);
    if (exactText !== null) return { text: exactText, symbol: "=" };
  }
  return { text: formatNumber(convert(value, from, to), 12), symbol: "≈" };
}

export function parseUnitSuffix(input: string, fallback: Unit = "in"): { numberText: string; unit: Unit } {
  let numberText = input.trim();
  for (const [pattern, unit] of UNIT_SUFFIXES) {
    if (pattern.test(numberText)) {
      numberText = numberText.replace(pattern, "").trim();
      return { numberText, unit };
    }
  }
  return { numberText, unit: fallback };
}

export function parseScalar(input: string): number | null {
  let text = input.trim().replace(/[−–]/g, "-").replace(/,/g, ".");
  for (const [glyph, fraction] of Object.entries(UNICODE_FRACTIONS)) {
    const escaped = glyph;
    text = text.replace(new RegExp(`(\\d)${escaped}`, "g"), `$1 ${fraction}`);
    text = text.replaceAll(glyph, fraction);
  }
  text = text.replace(/\s+/g, " ").trim();
  if (!text || text.startsWith("-")) return null;

  // Mixed fractions: 1 1/4, 1-1/4, and 1 1 1/4 (after a unicode glyph).
  const mixed = text.match(/^(\d+)(?:\s+|-)(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (!denominator) return null;
    return Number(mixed[1]) + Number(mixed[2]) / denominator;
  }
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (!denominator) return null;
    return Number(fraction[1]) / denominator;
  }
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseMeasurement(input: string, fallback: Unit = "in"): ParsedMeasurement | null {
  const { numberText, unit } = parseUnitSuffix(input, fallback);
  const value = parseScalar(numberText);
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  return { value, unit, expression: input.trim(), exactValue: parseExactScalar(numberText) };
}

export function convert(value: number, from: Unit, to: Unit): number {
  return (value * TO_MM[from]) / TO_MM[to];
}

export function toMillimetres(value: number, unit: Unit): number {
  return value * TO_MM[unit];
}

export function formatNumber(value: number, maximumFractionDigits = 3, minimumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  const bounded = Math.abs(value) < 1e-10 ? 0 : value;
  return new Intl.NumberFormat("id-ID", {
    useGrouping: false,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(bounded);
}

const EASY_CM: Array<[number, number]> = [
  [0.5, 1.3], [0.75, 1.9], [1, 2.5], [1.25, 3.2], [1.5, 3.8], [1.75, 4.4],
  [2, 5], [2.5, 6.4], [3, 7.6], [3.5, 8.9], [4, 10], [5, 12.7], [6, 15.2],
];

/** Memorized shop-friendly centimetres for common inch sizes; exact value remains untouched. */
export function easyCentimetres(inches: number): number {
  const hit = EASY_CM.find(([inch]) => Math.abs(inch - inches) < 1e-9);
  return hit ? hit[1] : Math.round(inches * 2.54 * 10) / 10;
}

export function shopMillimetres(value: number, unit: Unit): number {
  return Math.round(convert(value, unit, "mm"));
}

export function formatInches(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const remainder = value - whole;
  if (remainder < 1e-8) return String(whole);
  const candidates = [2, 4, 8, 16, 32, 64];
  let bestNumerator = 0;
  let bestDenominator = 16;
  let bestError = Infinity;
  for (const denominator of candidates) {
    const numerator = Math.round(remainder * denominator);
    const error = Math.abs(remainder - numerator / denominator);
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
    }
  }
  if (bestNumerator === bestDenominator) return String(whole + 1);
  let n = bestNumerator;
  let d = bestDenominator;
  while (n % 2 === 0 && d % 2 === 0) { n /= 2; d /= 2; }
  const fractionText = `${n}/${d}`;
  return whole ? `${whole} ${fractionText}` : fractionText;
}

export function displayConversion(value: number, from: Unit, mode: ConversionMode): {
  mm: string;
  cm: string;
  exactMm: string;
  exactCm: string;
  symbol: "≈" | "=";
} {
  if (mode === "accurate") {
    const mm = formatConvertedValue(value, from, "mm");
    const cm = formatConvertedValue(value, from, "cm");
    return {
      mm: mm.text, cm: cm.text, exactMm: mm.text, exactCm: cm.text,
      symbol: mm.symbol === cm.symbol ? mm.symbol : "≈",
    };
  }
  if (mode === "easy" && from === "in") {
    return {
      mm: formatNumber(Math.round(value * 25.4), 0),
      cm: formatNumber(easyCentimetres(value), 1),
      exactMm: formatConvertedValue(value, from, "mm").text, exactCm: formatConvertedValue(value, from, "cm").text, symbol: "≈",
    };
  }
  const mm = Math.round(convert(value, from, "mm"));
  const cm = Math.round(convert(value, from, "cm") * 10) / 10;
  return {
    mm: formatNumber(mm, 0), cm: formatNumber(cm, 1),
    exactMm: formatConvertedValue(value, from, "mm").text,
    exactCm: formatConvertedValue(value, from, "cm").text, symbol: "≈",
  };
}

export function classifyConversionQuery(query: string): ParsedMeasurement | null {
  const text = query.trim();
  if (!text) return null;
  const normalized = text
    .replace(/\b(berapa|sama dengan|ke|jadi|konversi|convert|to)\b/gi, " ")
    .replace(/\b(cm|mm|inch|inci|in|ft|kaki|meter|m)\b/gi, (match) => {
      const lower = match.toLowerCase();
      if (["inci", "inch", "in"].includes(lower)) return " inci ";
      if (["kaki", "ft"].includes(lower)) return " kaki ";
      return " ";
    })
    .replace(/[?=]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Only interpret short numeric/conversion-shaped queries, never a product search.
  if (!/^[\d\s.,/\-¼½¾⅛⅜⅝⅞⅓⅔]+(?:\s*(?:inches?|inch|inci|in|mm|cm|ft|kaki|meter|m|["″]))?(?:\s+\d+(?:[.,]\d+)?)?$/i.test(text) &&
      !/^[\d\s.,/\-¼½¾⅛⅜⅝⅞⅓⅔]+$/.test(normalized)) return null;
  const candidates = [text, normalized];
  for (const candidate of candidates) {
    const parsed = parseMeasurement(candidate, "in");
    if (parsed) return parsed;
  }
  return null;
}

export function nearestInchFraction(mm: number, denominator = 16): string {
  return formatInches(Math.round((mm / 25.4) * denominator) / denominator);
}

export function parseLengthToMm(input: string, fallback: Unit = "mm"): number | null {
  const parsed = parseMeasurement(input, fallback);
  return parsed ? toMillimetres(parsed.value, parsed.unit) : null;
}
