import { getSupabaseBrowserClient, supabaseConfigured } from "@/lib/supabase-browser";
import { CATEGORIES, PRODUCTS_DATA, type Category, type Product } from "@/lib/data";

const fallbackCategoryIcon: Record<string, string> = {
  sekrup: "screw", "baut-mur": "bolt", "paku-fisher": "nail", paku: "nail", "material-lembaran": "sheet",
  "mata-bor": "drill", "mata-gerinda": "disc", "perkakas-tangan": "tool", "alat-ukur": "measure",
  finishing: "paint", keselamatan: "safety", "hardware-furnitur": "furniture", "aksesori-mesin": "machine",
};

export function mapCloudCategory(row: Record<string, unknown>): Category {
  const id = String(row.id ?? row.slug ?? "kategori");
  return {
    id, slug: String(row.slug ?? id), name: String(row.name ?? id), short: String(row.name ?? id),
    icon: String(row.icon ?? fallbackCategoryIcon[id] ?? "tool"), imageKey: String(row.image_key ?? "hand-tools"),
    accent: String(row.accent ?? "steel"), description: String(row.description ?? "Kategori katalog."),
  };
}

export function mapCloudProduct(row: Record<string, unknown>): Product {
  const specs = row.specifications && typeof row.specifications === "object" ? row.specifications as Record<string, unknown> : {};
  const verification = ["example", "mathematical", "verified"].includes(String(row.verification)) ? String(row.verification) as Product["verification"] : "example";
  const number = (key: string) => { const value = Number(specs[key]); return Number.isFinite(value) && specs[key] !== null && specs[key] !== "" ? value : undefined; };
  return {
    id: String(row.id ?? row.slug), slug: String(row.slug ?? "produk"), name: String(row.name ?? "Barang tanpa nama"),
    categoryId: String(row.category_id ?? "perkakas-tangan"), subcategory: String(row.subcategory ?? "Umum"), code: String(row.code ?? "Cek produk"),
    imageKey: String(row.image_key ?? "hand-tools"), description: String(row.description ?? ""), uses: String(row.uses ?? ""), note: String(row.note ?? ""),
    verification, aliases: Array.isArray(row.aliases) ? row.aliases.map(String) : [],
    lengthIn: number("length_in"), lengthMm: number("length_mm"), widthMm: number("width_mm"), thicknessMm: number("thickness_mm"),
    nominalDiameterMm: number("nominal_diameter_mm"), diameterCode: specs.diameter_code ? String(specs.diameter_code) : undefined,
    headType: specs.head_type ? String(specs.head_type) : undefined, threadType: specs.thread_type ? String(specs.thread_type) : undefined,
    color: specs.color ? String(specs.color) : undefined, material: specs.material ? String(specs.material) : undefined,
    finish: specs.finish ? String(specs.finish) : undefined, sheetSize: specs.sheet_size_note ? String(specs.sheet_size_note) : undefined,
  };
}

export function mergeCatalogue(cloudCategories: Category[], cloudProducts: Product[]) {
  const categoriesBySlug = new Map<string, Category>();
  for (const category of CATEGORIES) categoriesBySlug.set(category.slug, category);
  for (const category of cloudCategories) categoriesBySlug.set(category.slug, category);
  const categories = [...categoriesBySlug.values()];
  const productsBySlug = new Map<string, Product>();
  for (const product of PRODUCTS_DATA) productsBySlug.set(product.slug, product);
  for (const product of cloudProducts) productsBySlug.set(product.slug, product);
  return { categories, products: [...productsBySlug.values()] };
}

export async function fetchCloudCatalogue() {
  if (!supabaseConfigured) return null;
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const [categoryResult, productResult] = await Promise.all([
    client.from("categories").select("*").eq("is_published", true).order("name"),
    client.from("products").select("*").eq("is_published", true).order("name").limit(2000),
  ]);
  if (categoryResult.error || productResult.error) return null;
  return mergeCatalogue(
    (categoryResult.data ?? []).map((row) => mapCloudCategory(row as Record<string, unknown>)),
    (productResult.data ?? []).map((row) => mapCloudProduct(row as Record<string, unknown>)),
  );
}
