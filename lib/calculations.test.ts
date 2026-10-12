import { describe, expect, it } from "vitest";
import { calculateCutEstimate, calculateSheet, calculateUnitPrice, calculateWeight } from "@/lib/calculations";
import { validateProductInput, validateQuizInput } from "@/lib/validation";

describe("kalkulator material", () => {
  it("menghitung luas dan volume satu panel", () => {
    const result = calculateSheet(2440, 1220, 12, "mm");
    expect(result.areaM2).toBeCloseTo(2.9768, 6);
    expect(result.volumeM3).toBeCloseTo(0.0357216, 8);
    expect(result.lengthMm).toBe(2440);
  });
  it("menghitung estimasi grid potongan dan orientasi", () => {
    const result = calculateCutEstimate({ sheetLength: 2440, sheetWidth: 1220, pieceLength: 600, pieceWidth: 400, kerf: 3, edge: 0 });
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(Math.max(result.normal, result.rotated));
    expect(result.orientation.length).toBeGreaterThan(0);
  });
  it("menghitung harga per unit tanpa menetapkan harga pasar", () => {
    const result = calculateUnitPrice(120000, 100, 10);
    expect(result.perItem).toBe(1200);
    expect(result.total).toBe(12000);
  });
  it("menghitung berat dari volume dan densitas input", () => {
    expect(calculateWeight(1000, 1000, 10, 500).massKg).toBeCloseTo(5, 8);
  });
});

describe("validasi panel admin", () => {
  it("menerima data minimum yang wajar", () => {
    expect(validateProductInput({ name: "Mata bor 6 mm", slug: "mata-bor-6-mm", category_id: "mata-bor", code: "Ø6 mm", verification: "example" }).valid).toBe(true);
  });
  it("menolak data wajib kosong, slug ilegal, dan dimensi negatif", () => {
    expect(validateProductInput({ name: "", slug: "bad slug", category_id: "", code: "" }).valid).toBe(false);
    expect(validateProductInput({ name: "Baut", slug: "Baut M8", category_id: "baut-mur", code: "M8", length_mm: -5 }).valid).toBe(false);
  });
  it("memastikan jawaban kuis cocok dengan pilihan", () => {
    expect(validateQuizInput({ prompt: "Berapa?", options: ["A", "B"], answer: "A" }).valid).toBe(true);
    expect(validateQuizInput({ prompt: "Berapa?", options: ["A", "B"], answer: "C" }).valid).toBe(false);
  });
});
