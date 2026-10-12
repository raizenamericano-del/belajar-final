import { describe, expect, it } from "vitest";
import { CATEGORIES, PRODUCTS_DATA } from "@/lib/data";
import { mapCloudCategory, mapCloudProduct, mergeCatalogue } from "@/lib/catalog-client";

describe("pemeta katalog Supabase", () => {
  it("memetakan spesifikasi tanpa menerjemahkan kode # menjadi diameter", () => {
    const product = mapCloudProduct({
      id: "cloud-1", slug: "contoh-sekrup", name: "Sekrup contoh", category_id: "sekrup", code: "#6 × 1 inch",
      subcategory: "Kayu", image_key: "https://example.supabase.co/storage/v1/object/public/product-images/test.png",
      verification: "example", aliases: ["screw", "sekrup"], specifications: { length_in: 1, length_mm: 25.4, diameter_code: "#6" },
    });
    expect(product.lengthIn).toBe(1);
    expect(product.lengthMm).toBe(25.4);
    expect(product.diameterCode).toBe("#6");
    expect(product.nominalDiameterMm).toBeUndefined();
    expect(product.imageKey).toMatch(/^https:/);
  });

  it("menggabungkan data cloud, mengganti slug yang sama dan mempertahankan demo lokal", () => {
    const localProduct = PRODUCTS_DATA[0];
    const cloudProduct = { ...localProduct, id: "cloud-override", name: "Versi Cloud", verification: "verified" as const };
    const addedProduct = { ...localProduct, id: "cloud-new", slug: "barang-cloud-baru", name: "Barang Cloud Baru" };
    const localCategory = CATEGORIES[0];
    const cloudCategory = { ...localCategory, name: "Kategori dari Cloud" };
    const addedCategory = mapCloudCategory({ id: "cloud-category", slug: "kategori-baru", name: "Kategori Baru" });
    const merged = mergeCatalogue([cloudCategory, addedCategory], [cloudProduct, addedProduct]);
    expect(merged.products.find((item) => item.slug === localProduct.slug)?.name).toBe("Versi Cloud");
    expect(merged.products.some((item) => item.slug === "barang-cloud-baru")).toBe(true);
    expect(merged.products.length).toBe(PRODUCTS_DATA.length + 1);
    expect(merged.categories.find((item) => item.slug === localCategory.slug)?.name).toBe("Kategori dari Cloud");
    expect(merged.categories.some((item) => item.slug === "kategori-baru")).toBe(true);
  });
});
