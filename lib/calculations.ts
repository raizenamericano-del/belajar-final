import { parseScalar, TO_MM, type Unit } from "@/lib/conversion";

export function valueToMm(value: number, unit: Unit): number { return value * TO_MM[unit]; }

export function calculateSheet(length: number, width: number, thickness: number, unit: Unit = "mm") {
  const lengthMm = valueToMm(length, unit);
  const widthMm = valueToMm(width, unit);
  const thicknessMm = valueToMm(thickness, unit);
  return {
    lengthMm, widthMm, thicknessMm,
    areaM2: (lengthMm * widthMm) / 1_000_000,
    volumeM3: (lengthMm * widthMm * thicknessMm) / 1_000_000_000,
  };
}

export type CutEstimateInput = { sheetLength: number; sheetWidth: number; pieceLength: number; pieceWidth: number; kerf?: number; edge?: number };
export function calculateCutEstimate(input: CutEstimateInput) {
  const { sheetLength, sheetWidth, pieceLength, pieceWidth } = input;
  const kerf = Math.max(0, input.kerf ?? 0);
  const edge = Math.max(0, input.edge ?? 0);
  const across = (available: number, piece: number) => piece > 0 ? Math.max(0, Math.floor((available - edge * 2 + kerf) / (piece + kerf))) : 0;
  const normalRows = across(sheetLength, pieceLength);
  const normalColumns = across(sheetWidth, pieceWidth);
  const rotatedRows = across(sheetLength, pieceWidth);
  const rotatedColumns = across(sheetWidth, pieceLength);
  const normal = normalRows * normalColumns;
  const rotated = rotatedRows * rotatedColumns;
  return {
    count: Math.max(normal, rotated), normal, rotated,
    orientation: normal >= rotated ? "Panjang potongan sejajar panjang lembar" : "Potongan diputar 90°",
    rows: normal >= rotated ? normalRows : rotatedRows,
    columns: normal >= rotated ? normalColumns : rotatedColumns,
  };
}

export function calculateUnitPrice(packPrice: number, packCount: number, quantity: number) {
  const perItem = packCount > 0 ? packPrice / packCount : 0;
  return { perItem, total: perItem * quantity };
}

export function calculateWeight(lengthMm: number, widthMm: number, thicknessMm: number, densityKgM3: number) {
  const volumeM3 = (lengthMm * widthMm * thicknessMm) / 1_000_000_000;
  return { volumeM3, massKg: volumeM3 * densityKgM3 };
}

export function parseNonNegative(input: string): number | null {
  const value = parseScalar(input);
  return value !== null && value >= 0 && Number.isFinite(value) ? value : null;
}
