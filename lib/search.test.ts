import { describe, expect, it } from "vitest";
import { detectQuickConversion, searchProducts } from "@/lib/search";
import { PRODUCTS_DATA } from "@/lib/data";

describe("smart search", () => {
  it("mengenali konversi dari bahasa sehari-hari", () => {
    const inches = detectQuickConversion("1 inch berapa cm");
    expect(inches?.from).toBe("in"); expect(inches?.to).toBe("cm"); expect(inches?.result).toBeCloseTo(2.54, 8);
    const mm = detectQuickConversion("25 mm berapa inch");
    expect(mm?.from).toBe("mm"); expect(mm?.to).toBe("in"); expect(mm?.result).toBeCloseTo(25 / 25.4, 8);
    expect(detectQuickConversion("1 1/4 inch ke mm")?.result).toBeCloseTo(31.75, 8);
  });
  it("mencari produk via nama, alias, kode, dan ukuran", () => {
    expect(searchProducts("mata bor 6 mm").some((item) => item.name === "Mata bor besi 6 mm" || item.name === "Mata bor kayu 6 mm")).toBe(true);
    expect(searchProducts("baut M8").some((item) => item.name.includes("M8"))).toBe(true);
    expect(searchProducts("sekrup ffo kuning #6 × 1 1/4″").some((item) => item.name.includes("1 1/4"))).toBe(true);
    expect(searchProducts("triplek 12 mm").some((item) => item.name === "Triplek tebal 12 mm")).toBe(true);
  });
  it("dataset awal melampaui 150 entri bermakna", () => expect(PRODUCTS_DATA.length).toBeGreaterThanOrEqual(150));
});
