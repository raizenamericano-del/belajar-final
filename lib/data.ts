import { formatInches, formatNumber } from "@/lib/conversion";

export type Category = {
  id: string; slug: string; name: string; short: string; icon: string; imageKey: string; accent: string; description: string; count?: number;
};

export type Product = {
  id: string; slug: string; name: string; categoryId: string; subcategory: string; code: string;
  imageKey: string; description: string; uses: string; note: string; verification: "example" | "mathematical" | "verified";
  aliases: string[]; lengthIn?: number; lengthMm?: number; widthMm?: number; thicknessMm?: number;
  nominalDiameterMm?: number; diameterCode?: string; headType?: string; threadType?: string;
  color?: string; material?: string; finish?: string; sheetSize?: string;
};

export const CATEGORIES: Category[] = [
  { id: "sekrup", slug: "sekrup", name: "Sekrup & pengencang", short: "Sekrup", icon: "screw", imageKey: "screw", accent: "orange", description: "Referensi jenis kepala, material, finishing, kode, dan panjang sekrup." },
  { id: "baut-mur", slug: "baut-mur", name: "Baut, mur & ring", short: "Baut & mur", icon: "bolt", imageKey: "bolt", accent: "steel", description: "Baut metrik dan kayu, mur, ring, anchor, bracket, rivet, dan pengencang." },
  { id: "paku-fisher", slug: "paku-fisher", name: "Paku, fisher & anchor", short: "Paku & fisher", icon: "nail", imageKey: "fastener", accent: "amber", description: "Referensi pengencang dinding dan kebutuhan pemasangan umum." },
  { id: "material-lembaran", slug: "material-lembaran", name: "Material lembaran", short: "Triplek & MDF", icon: "sheet", imageKey: "plywood", accent: "wood", description: "Triplek, plywood, MDF, blockboard, HPL, PVC board, dan material laminasi." },
  { id: "mata-bor", slug: "mata-bor", name: "Mata bor & bit", short: "Mata bor", icon: "drill", imageKey: "drill-bit", accent: "steel", description: "Mata bor kayu, besi, beton, bit obeng, router, dan aksesori bor." },
  { id: "mata-gerinda", slug: "mata-gerinda", name: "Mata gerinda", short: "Gerinda", icon: "disc", imageKey: "grinding-disc", accent: "orange", description: "Cutting wheel, grinding wheel, sanding disc, dan aksesori mesin potong." },
  { id: "perkakas-tangan", slug: "perkakas-tangan", name: "Perkakas tangan", short: "Perkakas", icon: "tool", imageKey: "hand-tools", accent: "wood", description: "Gergaji, pahat, kikir, klem, cutter, meteran, dan perkakas bengkel." },
  { id: "alat-ukur", slug: "alat-ukur", name: "Peralatan ukur", short: "Alat ukur", icon: "measure", imageKey: "measuring-tools", accent: "amber", description: "Jangka sorong, mikrometer, meteran, penggaris, waterpass, dan siku ukur." },
  { id: "finishing", slug: "finishing", name: "Lem & finishing", short: "Finishing", icon: "paint", imageKey: "finishing", accent: "orange", description: "Lem kayu, lem kontak, amplas, kuas, roller, dempul, dan pelapis." },
  { id: "keselamatan", slug: "keselamatan", name: "Keselamatan kerja", short: "K3", icon: "safety", imageKey: "safety", accent: "green", description: "Perlengkapan pelindung yang dipilih sesuai risiko pekerjaan." },
  { id: "hardware-furnitur", slug: "hardware-furnitur", name: "Hardware furnitur", short: "Furnitur", icon: "furniture", imageKey: "furniture-hardware", accent: "wood", description: "Engsel, rel laci, bracket, kaki furnitur, konektor, dan aksesori kabinet." },
  { id: "aksesori-mesin", slug: "aksesori-mesin", name: "Aksesori mesin", short: "Aksesori mesin", icon: "machine", imageKey: "router-bit", accent: "steel", description: "Mata router, mata gergaji, aksesori amplas, dan perlengkapan mesin." },
  { id: "paku", slug: "paku", name: "Paku & rivet", short: "Paku", icon: "nail", imageKey: "fastener", accent: "amber", description: "Paku kayu, paku beton, paku finishing, dan rivet." },
];

const PRODUCTS: Product[] = [];
function addProduct(p: Omit<Product, "id">) {
  const id = `p-${PRODUCTS.length + 1}`;
  PRODUCTS.push({ ...p, id });
}

const fractionLabel = (n: number) => `${formatInches(n)}″`;
const inchLengths = [0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4];
const screwFamilies = [
  { title: "Sekrup FFO kuning", subcategory: "FFO kuning", code: "FFO Kuning", size: "#6", imageKey: "screw", color: "Kuning", finish: "Label katalog: kuning", aliases: ["ffo", "kuning", "sekrup kayu"] as string[], lengths: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4] },
  { title: "Sekrup mentah", subcategory: "Sekrup mentah", code: "Mentah", size: "#6", imageKey: "screw", color: "Tidak ditentukan", finish: "Belum diverifikasi", aliases: ["mentah", "sekrup kayu"] as string[], lengths: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3] },
  { title: "Sekrup mentah", subcategory: "Sekrup mentah", code: "Mentah", size: "#8", imageKey: "screw", color: "Tidak ditentukan", finish: "Belum diverifikasi", aliases: ["mentah", "sekrup kayu"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4] },
  { title: "Sekrup gypsum", subcategory: "Sekrup gypsum", code: "Gypsum", size: "#6", imageKey: "screw", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["gypsum", "gipsum", "sekrup plafon"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2, 2.5] },
  { title: "Sekrup kayu", subcategory: "Sekrup kayu", code: "Kayu", size: "#8", imageKey: "screw", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["sekrup kayu", "wood screw"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2, 3] },
  { title: "Sekrup triplek / MDF", subcategory: "Sekrup triplek dan MDF", code: "Panel", size: "#6", imageKey: "screw", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["triplek", "mdf", "panel", "sekrup furnitur"] as string[], lengths: [0.5, 0.75, 1, 1.25, 1.5, 2] },
  { title: "Sekrup stainless steel", subcategory: "Stainless steel", code: "Stainless", size: "#8", imageKey: "screw", color: "Metalik", finish: "Stainless—grade tidak dicantumkan", aliases: ["stainless", "anti karat"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2] },
  { title: "Sekrup self tapping", subcategory: "Self tapping", code: "Self tapping", size: "#8", imageKey: "screw", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["self tapping", "seng", "plat"] as string[], lengths: [0.5, 0.75, 1, 1.25, 1.5, 2] },
  { title: "Sekrup roofing", subcategory: "Roofing", code: "Roofing", size: "#10", imageKey: "screw", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["roofing", "atap", "spandek"] as string[], lengths: [0.75, 1, 1.5, 2, 2.5] },
  { title: "Sekrup hitam", subcategory: "Sekrup hitam", code: "Hitam", size: "#6", imageKey: "screw", color: "Hitam", finish: "Warna label; coating belum diverifikasi", aliases: ["hitam", "black screw"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2, 2.5] },
  { title: "Sekrup furnitur", subcategory: "Pengencang furnitur", code: "Furnitur", size: "#8", imageKey: "furniture-hardware", color: "Belum diverifikasi", finish: "Belum diverifikasi", aliases: ["furnitur", "kabinet", "furniture"] as string[], lengths: [0.75, 1, 1.25, 1.5, 2, 3] },
];

for (const family of screwFamilies) {
  for (const lengthIn of family.lengths) {
    const label = fractionLabel(lengthIn);
    const slug = `${family.subcategory}-${family.size}-${formatInches(lengthIn)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const name = `${family.title} ${family.size} × ${label}`;
    addProduct({
      slug, name, categoryId: family.subcategory === "Pengencang furnitur" ? "hardware-furnitur" : "sekrup",
      subcategory: family.subcategory, code: `${family.code} ${family.size} × ${label}`,
      imageKey: family.imageKey, description: `Contoh referensi ${family.title.toLowerCase()} dengan kode ukuran ${family.size} dan panjang nominal ${label}.`,
      uses: "Pilih berdasarkan bahan yang disambung dan ikuti petunjuk pada kemasan. Uji pada potongan bahan sebelum pekerjaan akhir.",
      note: "Contoh entri katalog—variasi kepala, ulir, bahan, finishing, dan ketersediaan harus dicocokkan dengan kemasan toko.",
      verification: "example", aliases: [...family.aliases, family.size, label, formatInches(lengthIn)], lengthIn,
      diameterCode: family.size, color: family.color, finish: family.finish,
      headType: "Periksa kemasan", threadType: "Periksa kemasan", material: "Belum diverifikasi",
    });
  }
}

// Bolts, nuts, anchors and everyday hardware. Nominal labels are intentionally not treated as full product specifications.
const boltEntries: Array<[string, string, string, number?, string?]> = [
  ["Baut hex M6 × 20 mm", "Baut metrik", "M6 × 20 mm", 20, "baut hex m6"], ["Baut hex M6 × 30 mm", "Baut metrik", "M6 × 30 mm", 30, "baut hex m6"],
  ["Baut hex M6 × 40 mm", "Baut metrik", "M6 × 40 mm", 40, "baut hex m6"], ["Baut hex M8 × 20 mm", "Baut metrik", "M8 × 20 mm", 20, "baut hex m8"],
  ["Baut hex M8 × 30 mm", "Baut metrik", "M8 × 30 mm", 30, "baut hex m8"], ["Baut hex M8 × 40 mm", "Baut metrik", "M8 × 40 mm", 40, "baut hex m8"],
  ["Baut hex M10 × 30 mm", "Baut metrik", "M10 × 30 mm", 30, "baut hex m10"], ["Baut hex M10 × 50 mm", "Baut metrik", "M10 × 50 mm", 50, "baut hex m10"],
  ["Baut hex M12 × 40 mm", "Baut metrik", "M12 × 40 mm", 40, "baut hex m12"], ["Baut hex M12 × 60 mm", "Baut metrik", "M12 × 60 mm", 60, "baut hex m12"],
  ["Baut flange M8 × 25 mm", "Baut flange", "M8 × 25 mm", 25, "flange"], ["Baut flange M10 × 30 mm", "Baut flange", "M10 × 30 mm", 30, "flange"],
  ["Baut kayu kepala hex 8 × 60 mm", "Baut kayu", "8 × 60 mm", 60, "baut kayu"], ["Baut kayu kepala hex 10 × 75 mm", "Baut kayu", "10 × 75 mm", 75, "baut kayu"],
  ["Mur hex M6", "Mur", "M6", undefined, "mur m6"], ["Mur hex M8", "Mur", "M8", undefined, "mur m8"], ["Mur hex M10", "Mur", "M10", undefined, "mur m10"],
  ["Ring datar M8", "Ring", "M8", undefined, "ring washer"], ["Fisher nylon 6 mm", "Fisher", "Ø 6 mm", undefined, "fisher 6"], ["Fisher nylon 8 mm", "Fisher", "Ø 8 mm", undefined, "fisher 8"],
  ["Anchor ekspansi M10", "Anchor", "M10", undefined, "dynabolt anchor"], ["Bracket siku 40 × 40 mm", "Bracket", "40 × 40 mm", undefined, "siku bracket"],
  ["Rivet aluminium 4 mm", "Rivet", "Ø 4 mm", undefined, "paku rivet"], ["Konektor cam-lock furnitur", "Konektor furnitur", "Set konektor", undefined, "cam lock minifix"],
];
for (const [name, subcategory, code, lengthMm, alias] of boltEntries) {
  const metric = code.match(/M(\d+)/);
  const dia = metric ? Number(metric[1]) : undefined;
  addProduct({
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name,
    categoryId: subcategory.includes("Furnitur") ? "hardware-furnitur" : subcategory === "Fisher" || subcategory === "Anchor" ? "paku-fisher" : "baut-mur",
    subcategory, code, imageKey: subcategory === "Fisher" || subcategory === "Anchor" ? "fastener" : subcategory.includes("Furnitur") ? "furniture-hardware" : "bolt",
    description: `Entri contoh untuk ${subcategory.toLowerCase()} dengan penandaan ${code}.`,
    uses: "Sesuaikan bahan, diameter/panjang, jenis lubang, dan beban dengan petunjuk kemasan atau teknisi.",
    note: "Contoh katalog, bukan jaminan stok atau spesifikasi dari merek tertentu. Pitch ulir, kelas kekuatan, dan material tidak disimpulkan dari kode ukuran.",
    verification: "example", aliases: [alias ?? name.toLowerCase(), code.toLowerCase(), name.toLowerCase()],
    ...(lengthMm ? { lengthMm } : {}), ...(dia ? { nominalDiameterMm: dia } : {}), material: "Belum diverifikasi",
  });
}

const sheetMaterials = [
  { name: "Triplek", alias: ["plywood", "multipleks", "triplek"], imageKey: "plywood" },
  { name: "MDF", alias: ["mdf", "medium density fibreboard"], imageKey: "mdf" },
  { name: "Particle board", alias: ["particle board", "pb", "chipboard"], imageKey: "plywood" },
  { name: "Blockboard", alias: ["blockboard", "blokbod"], imageKey: "plywood" },
];
for (const sheet of sheetMaterials) {
  for (const thicknessMm of [3, 4, 6, 9, 12, 15, 18]) {
    const name = `${sheet.name} tebal ${thicknessMm} mm`;
    addProduct({
      slug: `${sheet.name.toLowerCase().replace(/\s+/g, "-")}-${thicknessMm}-mm`, name,
      categoryId: "material-lembaran", subcategory: sheet.name, code: `${thicknessMm} mm`, imageKey: sheet.imageKey,
      description: `Contoh referensi ${sheet.name} dengan ketebalan nominal ${thicknessMm} mm.`,
      uses: "Pilih menurut bentang, beban, lingkungan, dan hasil akhir. Tepi dan permukaan dapat memerlukan perlakuan berbeda.",
      note: "Tebal, ukuran lembar, toleransi, kelas, dan ketersediaan berbeda antar produsen. Ukuran 1220 × 2440 mm hanya contoh ukuran nominal yang umum dijumpai—ukur lembar aktual sebelum memotong.",
      verification: "example", aliases: [...sheet.alias, `${sheet.name} ${thicknessMm}`, `${thicknessMm} mm`], thicknessMm,
      widthMm: 1220, lengthMm: 2440, sheetSize: "Contoh nominal 1220 × 2440 mm; cek lembar aktual", material: sheet.name,
    });
  }
}

const drillItems: Array<[string, string, string, number, string[]]> = [
  ["Mata bor kayu", "Kayu", "Wood bit", 3, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 4, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 5, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 6, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 8, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 10, ["kayu"]], ["Mata bor kayu", "Kayu", "Wood bit", 12, ["kayu"]],
  ["Mata bor besi", "Besi", "HSS", 3, ["besi", "hss"]], ["Mata bor besi", "Besi", "HSS", 4, ["besi", "hss"]], ["Mata bor besi", "Besi", "HSS", 5, ["besi", "hss"]], ["Mata bor besi", "Besi", "HSS", 6, ["besi", "hss"]], ["Mata bor besi", "Besi", "HSS", 8, ["besi", "hss"]], ["Mata bor besi", "Besi", "HSS", 10, ["besi", "hss"]],
  ["Mata bor beton", "Beton", "Masonry bit", 4, ["beton", "tembok"]], ["Mata bor beton", "Beton", "Masonry bit", 5, ["beton", "tembok"]], ["Mata bor beton", "Beton", "Masonry bit", 6, ["beton", "tembok"]], ["Mata bor beton", "Beton", "Masonry bit", 8, ["beton", "tembok"]], ["Mata bor beton", "Beton", "Masonry bit", 10, ["beton", "tembok"]],
  ["Mata bor Forstner", "Forstner", "Forstner", 20, ["lubang rata", "engsel"]], ["Mata bor Forstner", "Forstner", "Forstner", 35, ["lubang rata", "engsel"]],
];
for (const [title, subcategory, code, mm, aliases] of drillItems) {
  const name = `${title} ${mm} mm`;
  addProduct({ slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${mm}-mm`, name, categoryId: "mata-bor", subcategory, code: `${code} Ø${mm} mm`, imageKey: "drill-bit",
    description: `Contoh ukuran nominal ${mm} mm untuk ${subcategory.toLowerCase()}.`, uses: "Kecepatan dan teknik pengeboran mengikuti material dan petunjuk produsen. Jepit benda kerja dan gunakan pelindung mata.",
    note: "Diameter pada nama adalah ukuran nominal contoh; panjang keseluruhan, material, shank, dan tipe ujung harus diperiksa pada produk aktual.", verification: "example", aliases: [...aliases, `${mm}mm`, `mata bor ${mm}`], nominalDiameterMm: mm, material: "Periksa kemasan" });
}

const discItems: Array<[string, number, string]> = [
  ["Cutting wheel logam", 100, "cutting wheel"], ["Cutting wheel logam", 115, "cutting wheel"], ["Cutting wheel logam", 125, "cutting wheel"], ["Cutting wheel logam", 180, "cutting wheel"],
  ["Grinding wheel", 100, "batu gerinda"], ["Grinding wheel", 115, "batu gerinda"], ["Grinding wheel", 125, "batu gerinda"], ["Grinding wheel", 180, "batu gerinda"],
  ["Sanding disc", 100, "amplas gerinda"], ["Sanding disc", 125, "amplas gerinda"], ["Flap disc", 100, "flap wheel"], ["Flap disc", 115, "flap wheel"],
];
for (const [name, diameter, alias] of discItems) {
  addProduct({ slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${diameter}-mm`, name: `${name} Ø${diameter} mm`, categoryId: "mata-gerinda", subcategory: name, code: `Ø${diameter} mm`, imageKey: "grinding-disc",
    description: `Contoh diameter luar nominal ${diameter} mm untuk kategori ${name.toLowerCase()}.`, uses: "Pastikan diameter lubang tengah, jenis material, batas RPM, dan kompatibilitas mesin sesuai label produk.",
    note: "Diameter luar saja tidak cukup untuk memastikan kompatibilitas. Cek bore, tebal, bahan kerja, dan batas kecepatan pada kemasan.", verification: "example", aliases: [alias, `${diameter}mm`, `gerinda ${diameter}`] });
}

const extraProducts: Array<[string, string, string, string, string, string[]]> = [
  ["Bit obeng plus PH2", "mata-bor", "Bit screwdriver", "PH2", "drill-bit", ["obeng plus", "phillips", "bit"]],
  ["Bit obeng minus 5 mm", "mata-bor", "Bit screwdriver", "5 mm", "drill-bit", ["obeng minus", "slotted", "bit"]],
  ["Bit obeng Torx T20", "mata-bor", "Bit screwdriver", "T20", "drill-bit", ["torx", "bit"]],
  ["Mata router lurus", "aksesori-mesin", "Router bit", "Profil lurus", "router-bit", ["router", "mata frais"]],
  ["Mata router round-over", "aksesori-mesin", "Router bit", "Round-over", "router-bit", ["router", "round over"]],
  ["Mata gergaji circular", "aksesori-mesin", "Mata gergaji", "Cek diameter dan bore", "circular-saw", ["circular saw", "pisau potong"]],
  ["Gergaji tangan kayu", "perkakas-tangan", "Gergaji", "Panjang daun cek produk", "hand-tools", ["handsaw", "gergaji"]],
  ["Pahat kayu", "perkakas-tangan", "Pahat", "Lebar mata cek produk", "hand-tools", ["chisel", "pahat"]],
  ["Kikir kayu", "perkakas-tangan", "Kikir", "Bentuk dan panjang cek produk", "hand-tools", ["file", "kikir"]],
  ["Klem F kayu", "perkakas-tangan", "Klem", "Rentang cek produk", "hand-tools", ["f clamp", "clamp", "ragum"]],
  ["Cutter retraktil", "perkakas-tangan", "Cutter", "Ukuran mata cek produk", "hand-tools", ["pisau cutter", "utility knife"]],
  ["Meteran gulung", "alat-ukur", "Meteran", "Panjang pita cek produk", "measuring-tools", ["meteran", "tape measure"]],
  ["Penggaris baja", "alat-ukur", "Penggaris", "Panjang dan skala cek produk", "measuring-tools", ["ruler", "penggaris"]],
  ["Siku ukur", "alat-ukur", "Siku", "Panjang sisi cek produk", "measuring-tools", ["try square", "siku"]],
  ["Jangka sorong", "alat-ukur", "Jangka sorong", "Rentang dan resolusi cek produk", "measuring-tools", ["caliper", "sigmat"]],
  ["Mikrometer luar", "alat-ukur", "Mikrometer", "Rentang dan resolusi cek produk", "measuring-tools", ["micrometer"]],
  ["Waterpass", "alat-ukur", "Waterpass", "Panjang cek produk", "measuring-tools", ["level", "water pass"]],
  ["Lem kayu PVA", "finishing", "Lem", "Volume dan waktu kerja cek kemasan", "finishing", ["lem pvac", "lem kayu"]],
  ["Lem kontak", "finishing", "Lem", "Jenis permukaan dan waktu tunggu cek label", "finishing", ["lem kuning", "contact adhesive"]],
  ["Amplas lembar", "finishing", "Amplas", "Pilih grit sesuai pekerjaan", "finishing", ["sandpaper", "kertas gosok"]],
  ["Kuas cat", "finishing", "Kuas", "Lebar kuas cek produk", "finishing", ["paint brush", "kuas"]],
  ["Roller cat", "finishing", "Roller", "Lebar dan bahan roller cek produk", "finishing", ["roller cat"]],
  ["Dempul kayu", "finishing", "Dempul", "Warna dan waktu kering cek kemasan", "finishing", ["wood filler"]],
  ["Kacamata pelindung", "keselamatan", "Pelindung mata", "Pilih tingkat perlindungan sesuai risiko", "safety", ["safety glasses", "kacamata safety"]],
  ["Pelindung pendengaran", "keselamatan", "Pelindung telinga", "Nilai atenuasi cek label", "safety", ["ear protection", "earplug"]],
  ["Masker partikulat", "keselamatan", "Pelindung pernapasan", "Pilih tipe sesuai risiko dan standar", "safety", ["respirator", "masker debu"]],
  ["Sarung tangan kerja", "keselamatan", "Pelindung tangan", "Jenis sarung tangan harus cocok dengan pekerjaan", "safety", ["work gloves", "sarung tangan"]],
  ["Engsel kabinet", "hardware-furnitur", "Engsel", "Sudut buka dan overlay cek produk", "furniture-hardware", ["hinge", "engsel lemari"]],
  ["Rel laci", "hardware-furnitur", "Rel", "Panjang dan beban cek produk", "furniture-hardware", ["drawer slide", "rel laci"]],
  ["Handle kabinet", "hardware-furnitur", "Handle", "Jarak antar lubang cek produk", "furniture-hardware", ["tarikan kabinet", "handle"]],
  ["Kaki meja adjustable", "hardware-furnitur", "Kaki furnitur", "Rentang tinggi cek produk", "furniture-hardware", ["kaki meja"]],
  ["HPL lembar", "material-lembaran", "HPL", "Ukuran dan tebal mengikuti produsen", "plywood", ["high pressure laminate", "hpl"]],
  ["PVC board", "material-lembaran", "PVC board", "Ukuran dan tebal mengikuti produsen", "plywood", ["pvc foam board"]],
  ["Papan kayu solid", "material-lembaran", "Kayu solid", "Ukuran bervariasi; ukur stok aktual", "plywood", ["papan kayu", "kayu"]],
  ["Blockboard", "material-lembaran", "Blockboard", "Ukuran bervariasi; ukur stok aktual", "plywood", ["blokbod"]],
  ["Paku kayu", "paku", "Paku", "Panjang dan gauge cek produk", "fastener", ["paku biasa", "nail"]],
  ["Paku beton", "paku", "Paku beton", "Jenis sesuai material dan alat", "fastener", ["concrete nail"]],
  ["Paku finishing", "paku", "Paku finishing", "Pilih ukuran sesuai pekerjaan", "fastener", ["finish nail"]],
  ["Paku tembak", "paku", "Paku tembak", "Tipe dan panjang harus cocok dengan mesin", "fastener", ["staple nail", "brad nail"]],
  ["Fisher hollow wall", "paku-fisher", "Anchor dinding", "Kapasitas beban dan material dinding cek kemasan", "fastener", ["toggle bolt", "hollow wall anchor"]],
  ["Bracket siku furnitur", "hardware-furnitur", "Bracket", "Dimensi dan beban cek produk", "furniture-hardware", ["corner brace"]],
];
for (const [name, categoryId, subcategory, code, imageKey, aliases] of extraProducts) {
  addProduct({ slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name, categoryId, subcategory, code, imageKey,
    description: `Referensi kategori ${subcategory.toLowerCase()} untuk membantu mengenali nama dan fungsi barang.`,
    uses: "Cocokkan spesifikasi, kapasitas, ukuran, dan cara pakai dengan label produsen serta kondisi pekerjaan.",
    note: "Deskripsi kategori umum. Detail ukuran, material, standar, kapasitas, dan kompatibilitas tidak diasumsikan—periksa kemasan atau datasheet produk aktual.",
    verification: "example", aliases: [...aliases, name.toLowerCase()] });
}

export const PRODUCTS_DATA: Product[] = PRODUCTS;
export const PRODUCT_COUNT = PRODUCTS_DATA.length;
export const getProductBySlug = (slug: string) => PRODUCTS_DATA.find((product) => product.slug === slug);
export const getCategoryBySlug = (slug: string) => CATEGORIES.find((category) => category.slug === slug || category.id === slug);
export const productsInCategory = (categoryId: string) => PRODUCTS_DATA.filter((product) => product.categoryId === categoryId);

const referenceInches = [
  ...Array.from({ length: 15 }, (_, i) => (i + 1) / 16),
  1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6,
];
export const FRACTION_ROWS = referenceInches.map((inches) => ({
  inches, label: `${formatInches(inches)}″`, cm: Number((inches * 2.54).toFixed(1)), mm: Math.round(inches * 25.4),
  exactCm: Number((inches * 2.54).toFixed(6)), exactMm: Number((inches * 25.4).toFixed(6)),
}));

export type LearningModule = { slug: string; title: string; category: string; minutes: number; imageKey: string; intro: string; body: string[]; takeaway: string; question: string; options: string[]; answer: string; explanation: string };
export const LEARNING_MODULES: LearningModule[] = [
  { slug: "satuan-inci", title: "Kenalan dengan satuan inci", category: "Dasar ukuran", minutes: 4, imageKey: "measuring-tools", intro: "Inci sering muncul pada ukuran sekrup, mata bor, dan perkakas impor.", body: ["Simbol inci sering ditulis sebagai in, inch, tanda petik dua (″), atau tanda kutip pada label. Satu inci tepat sama dengan 25,4 mm atau 2,54 cm.", "Untuk hitung cepat di toko, inci dapat dikalikan 2,54 untuk mendapatkan cm. Jika perlu ketelitian, simpan angka desimalnya dan jangan membulatkan di tengah perhitungan."], takeaway: "1 inch = 25,4 mm = 2,54 cm (eksak).", question: "Berapa nilai eksak 1 inch dalam mm?", options: ["25 mm", "25,4 mm", "2,54 mm"], answer: "25,4 mm", explanation: "Definisi internasional: 1 inch tepat 25,4 mm." },
  { slug: "pecahan-inci", title: "Membaca pecahan inci", category: "Dasar ukuran", minutes: 5, imageKey: "measuring-tools", intro: "Ukuran pada meteran imperial sering memakai pecahan seperti 3/4 atau 1 1/4 inci.", body: ["Angka di atas garis pecahan adalah pembilang, dan angka di bawahnya adalah penyebut. Pada 3/4, satu inci dibagi menjadi empat bagian lalu diambil tiga bagian.", "Pecahan campuran seperti 1 1/4 berarti 1 inci ditambah 1/4 inci. Bentuk 1-1/4 pada label biasanya memiliki makna sama; pastikan konteksnya adalah ukuran."], takeaway: "1 1/4″ = 1,25″ = 31,75 mm eksak.", question: "1 1/2 inci berarti berapa inci desimal?", options: ["1,25", "1,5", "2,5"], answer: "1,5", explanation: "Setengah inci adalah 0,5; jadi 1 + 0,5 = 1,5 inci." },
  { slug: "cm-dan-mm", title: "Bedakan cm dan mm", category: "Dasar ukuran", minutes: 3, imageKey: "measuring-tools", intro: "Milimeter dipakai untuk detail kecil; sentimeter membuat ukuran panjang lebih ringkas.", body: ["Dalam sistem metrik, 1 cm terdiri dari 10 mm. Jadi 25 mm sama dengan 2,5 cm.", "Jangan menggeser koma tanpa melihat satuan. Tulis satuan di catatan pesanan, terutama jika angka dekat seperti 6 mm dan 6 cm."], takeaway: "1 cm = 10 mm. 10 mm = 1 cm.", question: "12 mm sama dengan berapa cm?", options: ["0,12 cm", "1,2 cm", "12 cm"], answer: "1,2 cm", explanation: "Bagi mm dengan 10 untuk mendapatkan cm." },
  { slug: "membaca-meteran", title: "Cara membaca meteran", category: "Alat ukur", minutes: 5, imageKey: "measuring-tools", intro: "Baca skala dengan mata tegak lurus dan pastikan kait atau titik nol menempel benar.", body: ["Pada skala metrik, garis bernomor besar umumnya menandai sentimeter; garis kecil di antaranya menandai milimeter. Satu jarak sentimeter memiliki sepuluh interval mm.", "Tarik pita lurus, jangan melengkung, dan gunakan pengunci dengan aman. Untuk pengukuran presisi, ulangi dari titik nol dan cek bacaan kedua."], takeaway: "Baca garis skala, bukan hanya angka besar; periksa titik nol dan posisi pandang.", question: "Pada skala metrik, 1 cm dibagi menjadi berapa mm?", options: ["5", "10", "100"], answer: "10", explanation: "Satu sentimeter sama dengan sepuluh milimeter." },
  { slug: "kode-sekrup", title: "Membaca kode ukuran sekrup", category: "Sekrup", minutes: 6, imageKey: "screw", intro: "Kode sekrup bisa menunjukkan seri/diameter nominal dan panjang; tanda # bukan angka panjang.", body: ["Contoh kode: #6 × 1 1/4″. Bagian #6 adalah kode ukuran sekrup (diameter nominal menurut sistem tertentu), sedangkan 1 1/4″ adalah panjang nominal yang tertulis.", "Kode #6 atau #8 tidak boleh otomatis diubah ke milimeter tanpa tabel standar dan jenis sekrup yang tepat. Diameter luar aktual juga bisa berbeda menurut standar/produsen."], takeaway: "Pisahkan kode diameter/seri dari panjang; panjang 1 1/4″ = 31,75 mm eksak.", question: "Pada #6 × 1″, bagian yang menyatakan panjang adalah?", options: ["#6", "1″", "Keduanya pasti mm"], answer: "1″", explanation: "#6 adalah kode ukuran; 1 inch adalah panjang nominal pada contoh kode tersebut." },
  { slug: "panjang-dan-diameter", title: "Panjang vs diameter sekrup", category: "Sekrup", minutes: 4, imageKey: "screw", intro: "Dua ukuran sekrup tidak boleh tertukar saat melayani pembeli.", body: ["Panjang umumnya diukur dari bawah kepala untuk banyak sekrup kepala datar, sementara pada kepala menonjol dapat diukur dari bawah kepala sampai ujung. Cara ukur dapat berbeda sesuai bentuk kepala.", "Diameter adalah ukuran badan/ulir. Kode #6 bukan panjang. Gunakan penggaris, kaliper, atau tabel pabrikan yang cocok dengan tipe sekrup."], takeaway: "Tanya: yang dimaksud panjang atau diameter? Bentuk kepala dapat memengaruhi cara ukur.", question: "Kode #6 sebaiknya langsung dianggap sebagai?", options: ["Panjang 6 mm", "Diameter 6 mm", "Kode seri; cek standar/produk"], answer: "Kode seri; cek standar/produk", explanation: "Jangan mengubah kode screw # menjadi mm tanpa referensi produk." },
  { slug: "kepala-sekrup", title: "Mengenali bentuk kepala sekrup", category: "Sekrup", minutes: 4, imageKey: "screw", intro: "Kepala memengaruhi alat yang dipakai dan cara duduk sekrup pada benda kerja.", body: ["Istilah umum meliputi countersunk (kepala tanam), pan head, dan kepala bulat. Penggerak dapat berupa plus, minus, Torx, atau tipe lain.", "Bentuk sesungguhnya dan kecocokan bit ditentukan produk. Pastikan bit duduk pas agar kepala tidak slek."], takeaway: "Cocokkan bentuk penggerak dan bit sebelum pemasangan.", question: "Apa tindakan baik sebelum mengencangkan sekrup?", options: ["Pilih bit yang pas", "Paksa bit yang longgar", "Abaikan bentuk kepala"], answer: "Pilih bit yang pas", explanation: "Bit yang sesuai mengurangi risiko slip dan merusak kepala." },
  { slug: "jenis-ulir", title: "Mengenali jenis ulir", category: "Sekrup", minutes: 4, imageKey: "screw", intro: "Ulir kayu, ulir mesin, dan ulir sheet-metal memiliki tujuan berbeda.", body: ["Ulir kasar sering digunakan pada kayu atau material lunak, sedangkan ulir mesin dipasangkan dengan mur atau lubang berulir. Namun detail ulir selalu cek spesifikasi produk.", "Jangan menukar baut/ulir hanya karena diameternya terlihat mirip. Pitch, material, dan aplikasi menentukan kecocokan."], takeaway: "Cocokkan ulir dengan material, mur, dan spesifikasi produsen.", question: "Ulir baut metrik perlu dicocokkan terutama dengan?", options: ["Mur/pitch yang sesuai", "Warna benda", "Panjang meja"], answer: "Mur/pitch yang sesuai", explanation: "Diameter saja tidak cukup; pitch ulir harus cocok." },
  { slug: "sekrup-kayu-gypsum", title: "Sekrup kayu dan gypsum", category: "Sekrup", minutes: 5, imageKey: "screw", intro: "Nama sekrup memberi petunjuk aplikasi, tetapi bukan pengganti spesifikasi.", body: ["Sekrup kayu dan sekrup gypsum dapat berbeda pada bentuk ulir, kepala, kekerasan, dan finishing. Jangan menganggap semua sekrup hitam adalah sekrup gypsum.", "Ikuti label produsen dan pilih pengencang sesuai lapisan/material yang disambung."], takeaway: "Warna bukan bukti tunggal jenis coating atau kegunaan.", question: "Apakah semua sekrup hitam pasti cocok untuk gypsum?", options: ["Ya", "Tidak, cek spesifikasi", "Hanya jika #6"], answer: "Tidak, cek spesifikasi", explanation: "Warna saja tidak membuktikan tipe dan aplikasi." },
  { slug: "baut-dan-mur", title: "Pengenalan baut dan mur", category: "Pengencang", minutes: 5, imageKey: "bolt", intro: "Baut metrik menggunakan penandaan seperti M6 atau M8.", body: ["Pada sistem metrik, angka setelah M menunjukkan diameter nominal ulir dalam milimeter, bukan panjang baut. Contoh M8 memiliki diameter nominal ulir 8 mm; panjang batang disebut terpisah.", "Pitch ulir, kelas kekuatan, material, dan panjang perlu dilihat pada deskripsi atau kemasan."], takeaway: "M8 = diameter nominal ulir 8 mm; bukan panjang baut 8 mm.", question: "M8 berarti apa?", options: ["Panjang 8 mm", "Diameter nominal ulir 8 mm", "8 buah baut"], answer: "Diameter nominal ulir 8 mm", explanation: "Angka setelah M menyatakan diameter nominal ulir metrik." },
  { slug: "mengenal-mata-bor", title: "Mengenal mata bor", category: "Perkakas", minutes: 5, imageKey: "drill-bit", intro: "Bentuk ujung dan bahan mata bor perlu cocok dengan benda kerja.", body: ["Mata bor kayu, logam, dan beton punya geometri ujung berbeda. Ukuran diameter nominal biasanya tercetak pada batang atau kemasan.", "Gunakan kecepatan dan mode yang sesuai, jepit benda kerja, dan hindari menyentuh mata bor setelah digunakan."], takeaway: "Pilih tipe mata bor sesuai material; angka diameter bukan panjang totalnya.", question: "Angka 6 mm pada mata bor biasanya merujuk ke?", options: ["Diameter nominal", "Panjang keseluruhan", "Berat"], answer: "Diameter nominal", explanation: "Kode 6 mm umumnya menandai diameter nominal lubang yang dibor." },
  { slug: "mengenal-triplek", title: "Pengenalan triplek dan plywood", category: "Material", minutes: 5, imageKey: "plywood", intro: "Material berlapis tersedia dengan kualitas dan ukuran yang berbeda-beda.", body: ["Triplek/plywood tersusun dari lapisan veneer. Jumlah lapisan, kelas muka, perekat, dan toleransi bervariasi menurut produsen.", "Tebal yang tertulis adalah nominal. Ukur ulang lembar yang diterima dan perhatikan kondisi tepi serta kerataan."], takeaway: "Cek tebal aktual, kelas, kualitas muka, dan kondisi lembar.", question: "Apakah ukuran lembar triplek selalu sama pada semua merek?", options: ["Ya, selalu", "Tidak, periksa lembar aktual", "Hanya beda warnanya"], answer: "Tidak, periksa lembar aktual", explanation: "Dimensi dan toleransi dapat berbeda antar produsen." },
  { slug: "mdf-plywood-blockboard", title: "MDF, plywood, dan blockboard", category: "Material", minutes: 6, imageKey: "mdf", intro: "Tiga material panel yang terlihat serupa punya konstruksi dan karakter berbeda.", body: ["MDF dibuat dari serat kayu yang dipadatkan; plywood dari lapisan veneer; blockboard umumnya berinti strip kayu. Konstruksi dan kinerja tiap produk perlu diverifikasi pada datasheet.", "Gunakan sesuai kebutuhan finishing, beban, kelembapan, dan cara pengencangan. Jangan menyamakan ketahanan air semua panel."], takeaway: "Nama material memberi petunjuk konstruksi, bukan jaminan grade atau ketahanan air.", question: "Mana yang memiliki inti lapisan veneer?", options: ["Plywood", "MDF", "Amplas"], answer: "Plywood", explanation: "Plywood tersusun dari beberapa lapis veneer yang direkatkan." },
  { slug: "dimensi-material", title: "Membaca panjang × lebar × tebal", category: "Material", minutes: 4, imageKey: "plywood", intro: "Dimensi panel dan papan umumnya ditulis panjang, lebar, lalu tebal.", body: ["Misal 2440 × 1220 × 12 mm: dua ukuran pertama adalah sisi lembar, angka terakhir adalah tebal. Urutan label bisa berbeda, jadi baca satuannya.", "Untuk menghitung luas gunakan panjang × lebar setelah mengubah keduanya ke satuan yang sama."], takeaway: "Pastikan urutan dimensi dan satuannya sebelum menghitung.", question: "Pada 2440 × 1220 × 12 mm, nilai terakhir biasanya menunjukkan?", options: ["Tebal", "Harga", "Jumlah"], answer: "Tebal", explanation: "Dalam contoh dimensi panel, 12 mm adalah ketebalan nominal." },
  { slug: "alat-ukur", title: "Memilih alat ukur", category: "Alat ukur", minutes: 4, imageKey: "measuring-tools", intro: "Pilih alat ukur menurut rentang dan ketelitian yang dibutuhkan.", body: ["Meteran cocok untuk panjang dan tata letak; penggaris untuk rentang kecil; jangka sorong untuk diameter luar/dalam dan kedalaman; mikrometer untuk pengukuran kecil presisi.", "Bersihkan permukaan ukur, kalibrasi bila perlu, dan baca resolusi alat sebelum mencatat hasil."], takeaway: "Alat yang tepat mengikuti rentang, ketelitian, dan bentuk benda.", question: "Alat yang lazim untuk mengukur diameter kecil lebih teliti adalah?", options: ["Mikrometer", "Kuas", "Klem"], answer: "Mikrometer", explanation: "Mikrometer dirancang untuk pengukuran dimensi kecil yang lebih presisi." },
  { slug: "finishing-produk", title: "Memahami finishing produk", category: "Finishing", minutes: 4, imageKey: "finishing", intro: "Finishing dapat berarti lapisan permukaan atau tahap akhir pengerjaan.", body: ["Istilah zinc plated, stainless, atau cat bukan hal yang sama. Ketahanan korosi bergantung pada bahan, proses, lingkungan, dan produsen.", "Untuk lem dan pelapis, ikuti cara aplikasi, ventilasi, waktu kering, serta label keselamatan."], takeaway: "Cek label dan lembar keselamatan; jangan menyimpulkan kualitas dari warna saja.", question: "Apakah warna kuning selalu memastikan material tertentu?", options: ["Ya", "Tidak, cek spesifikasi", "Selalu kuningan"], answer: "Tidak, cek spesifikasi", explanation: "Warna tidak cukup untuk menetapkan material atau coating." },
  { slug: "k3-perkakas", title: "Keselamatan kerja perkayuan", category: "Keselamatan", minutes: 4, imageKey: "safety", intro: "PPE yang benar dipilih berdasarkan bahaya pekerjaan dan instruksi alat.", body: ["Gunakan pelindung mata saat ada risiko serpihan; pelindung pendengaran ketika bising; respirator sesuai jenis debu/uap; sarung tangan hanya jika aman untuk aktivitas tersebut.", "Sarung tangan dapat tersangkut pada bagian berputar. Ikuti manual mesin dan aturan K3 di tempat kerja."], takeaway: "APD dipilih sesuai risiko—tidak ada satu perlengkapan yang cocok untuk semua pekerjaan.", question: "APD sebaiknya dipilih berdasarkan?", options: ["Risiko dan petunjuk pekerjaan", "Warna alat", "Ukuran ruangan saja"], answer: "Risiko dan petunjuk pekerjaan", explanation: "Risiko kerja dan label/manul alat menentukan perlindungan yang sesuai." },
  { slug: "paku-fisher-anchor", title: "Paku, fisher, dan anchor", category: "Pengencang", minutes: 5, imageKey: "fastener", intro: "Pengencang dinding dipilih menurut bahan substrat, beban, dan metode pemasangan.", body: ["Fisher atau plug dinding bekerja bersama sekrup pada substrat tertentu. Anchor ekspansi, toggle, fisher nylon, dan pengencang lain tidak saling menggantikan begitu saja.", "Tentukan jenis dinding, beban yang akan ditahan, diameter bor, panjang pengencang, dan instruksi produsen. Jangan menjanjikan kapasitas beban tanpa data produk.", "Paku kayu, paku beton, dan paku finishing juga berbeda bentuk serta aplikasinya. Cocokkan dengan alat dan bahan kerja."], takeaway: "Untuk fisher/anchor: kenali substrat dan beban, lalu cocokkan dengan spesifikasi kemasan.", question: "Sebelum memilih fisher atau anchor, apa yang paling penting diketahui?", options: ["Jenis dinding dan beban", "Warna ruangan", "Panjang meja kerja"], answer: "Jenis dinding dan beban", explanation: "Tipe anchor dan kapasitasnya bergantung pada substrat dan kondisi beban." },
];

export type QuizItem = { id: string; category: string; prompt: string; options: string[]; answer: string; explanation: string; imageKey?: string };
export const QUIZ_QUESTIONS: QuizItem[] = [
  { id: "q-inch-mm", category: "konversi", prompt: "1 inch sama dengan berapa mm?", options: ["2,54 mm", "25,4 mm", "254 mm"], answer: "25,4 mm", explanation: "1 inch tepat 25,4 mm." },
  { id: "q-inch-cm", category: "konversi", prompt: "1 inch sama dengan berapa cm?", options: ["2,54 cm", "25,4 cm", "0,254 cm"], answer: "2,54 cm", explanation: "1 inch tepat 2,54 cm." },
  { id: "q-34", category: "konversi", prompt: "3/4 inch berapa mm secara eksak?", options: ["19,05 mm", "18 mm", "25,4 mm"], answer: "19,05 mm", explanation: "0,75 × 25,4 = 19,05 mm." },
  { id: "q-114", category: "konversi", prompt: "1 1/4 inch berapa mm secara eksak?", options: ["31,75 mm", "32,5 mm", "25,4 mm"], answer: "31,75 mm", explanation: "1,25 × 25,4 = 31,75 mm." },
  { id: "q-112", category: "konversi", prompt: "1 1/2 inch berapa mm secara eksak?", options: ["38,1 mm", "35,1 mm", "50,8 mm"], answer: "38,1 mm", explanation: "1,5 × 25,4 = 38,1 mm." },
  { id: "q-2in", category: "konversi", prompt: "2 inch berapa mm secara eksak?", options: ["50,8 mm", "51,2 mm", "25,4 mm"], answer: "50,8 mm", explanation: "2 × 25,4 = 50,8 mm." },
  { id: "q-3in", category: "konversi", prompt: "3 inch berapa mm secara eksak?", options: ["76,2 mm", "76 mm", "72,6 mm"], answer: "76,2 mm", explanation: "3 × 25,4 = 76,2 mm." },
  { id: "q-ft", category: "konversi", prompt: "1 kaki (1 ft) sama dengan berapa mm?", options: ["304,8 mm", "30,48 mm", "254 mm"], answer: "304,8 mm", explanation: "1 ft = 12 inch; 12 × 25,4 = 304,8 mm." },
  { id: "q-cm-mm", category: "konversi", prompt: "1 cm sama dengan berapa mm?", options: ["10 mm", "100 mm", "1 mm"], answer: "10 mm", explanation: "1 cm = 10 mm." },
  { id: "q-12mm", category: "konversi", prompt: "12 mm sama dengan berapa cm?", options: ["1,2 cm", "12 cm", "0,12 cm"], answer: "1,2 cm", explanation: "12 ÷ 10 = 1,2 cm." },
  { id: "q-m8", category: "baut", prompt: "Dalam kode baut metrik, M8 menunjukkan apa?", options: ["Panjang 8 mm", "Diameter nominal ulir 8 mm", "8 buah"], answer: "Diameter nominal ulir 8 mm", explanation: "Angka setelah M adalah diameter nominal ulir, bukan panjang baut." },
  { id: "q-screw6", category: "sekrup", prompt: "Pada kode sekrup #6 × 1″, bagian yang menunjukkan panjang adalah?", options: ["#6", "1″", "Tidak ada"], answer: "1″", explanation: "#6 adalah kode ukuran/seri; 1 inch adalah panjang nominal contoh." },
  { id: "q-color", category: "sekrup", prompt: "Apakah warna hitam membuktikan semua sekrup punya coating yang sama?", options: ["Ya", "Tidak, cek spesifikasi", "Hanya jika panjang 1 inch"], answer: "Tidak, cek spesifikasi", explanation: "Warna tidak cukup untuk memastikan material atau proses coating." },
  { id: "q-bit", category: "mata-bor", prompt: "Label mata bor 6 mm biasanya merujuk pada?", options: ["Diameter nominal", "Panjang total", "Berat"], answer: "Diameter nominal", explanation: "Ukuran mata bor umumnya menyatakan diameter nominal." },
  { id: "q-sheet", category: "material", prompt: "Pada dimensi panel 2440 × 1220 × 12 mm, nilai terakhir biasanya berarti?", options: ["Tebal", "Lebar", "Jumlah lapisan"], answer: "Tebal", explanation: "Angka terakhir pada contoh tersebut menunjukkan ketebalan nominal." },
  { id: "q-fraction", category: "konversi", prompt: "3/4 inch sebagai angka desimal adalah?", options: ["0,75", "0,34", "0,5"], answer: "0,75", explanation: "3 ÷ 4 = 0,75." },
  { id: "q-mm-in", category: "konversi", prompt: "25,4 mm secara eksak sama dengan?", options: ["1 inch", "1 cm", "2 inch"], answer: "1 inch", explanation: "25,4 mm = 1 inch." },
  { id: "q-plywood", category: "material", prompt: "Plywood umumnya dibuat dari lapisan apa?", options: ["Veneer", "Serat kain", "Pasir"], answer: "Veneer", explanation: "Plywood tersusun dari lapisan veneer yang direkatkan." },
  { id: "q-mdf", category: "material", prompt: "MDF dibuat terutama dari?", options: ["Serat kayu yang dipadatkan", "Lembaran logam", "Kaca"], answer: "Serat kayu yang dipadatkan", explanation: "MDF adalah papan serat kayu kepadatan menengah." },
  { id: "q-mm-cm", category: "konversi", prompt: "100 mm sama dengan?", options: ["10 cm", "1 cm", "100 cm"], answer: "10 cm", explanation: "100 mm ÷ 10 = 10 cm." },
  { id: "q-inaccurate", category: "konversi", prompt: "3/4 inch kira-kira 1,9 cm. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Benar", explanation: "0,75 × 2,54 = 1,905 cm, dibulatkan satu desimal menjadi 1,9 cm." },
  { id: "q-2true", category: "konversi", prompt: "2 inch = 50,8 mm secara eksak. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Benar", explanation: "2 × 25,4 = 50,8 mm." },
  { id: "q-wrong3-4", category: "konversi", prompt: "3/4 inch = 3 cm. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Salah", explanation: "3/4 inch = 1,905 cm, bukan 3 cm." },
  { id: "q-m8-wrong", category: "baut", prompt: "M8 berarti panjang baut 8 mm. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Salah", explanation: "M8 menunjukkan diameter nominal ulir; panjang ditulis terpisah." },
  { id: "q-diameter-length", category: "mata-bor", prompt: "Diameter mata bor sama dengan panjang keseluruhannya. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Salah", explanation: "Diameter dan panjang keseluruhan adalah dimensi berbeda." },
  { id: "q-safety", category: "keselamatan", prompt: "Sarung tangan selalu aman digunakan di dekat bagian mesin berputar. Pernyataan ini?", options: ["Benar", "Salah"], answer: "Salah", explanation: "Sarung tangan dapat tersangkut; ikuti manual mesin dan penilaian risiko." },
  { id: "q-m8-pitch", category: "baut", prompt: "Selain diameter M8, apa yang perlu cocok saat memilih mur?", options: ["Pitch ulir", "Warna cat", "Panjang meja"], answer: "Pitch ulir", explanation: "Pitch ulir perlu cocok, selain diameter dan standar." },
  { id: "q-mm-inch", category: "konversi", prompt: "25 mm paling dekat dengan ukuran inci yang mana?", options: ["1 inch", "1/2 inch", "2 inch"], answer: "1 inch", explanation: "1 inch = 25,4 mm, sangat dekat dengan 25 mm." },
  { id: "q-fisher", category: "pengencang", prompt: "Fisher/plug biasanya digunakan sebagai bagian dari pemasangan pada?", options: ["Dinding atau substrat", "Kabel listrik saja", "Mata bor"], answer: "Dinding atau substrat", explanation: "Fisher/plug membantu menahan pengencang pada substrat; pilih berdasarkan bahan dan beban." },
  { id: "q-kerf", category: "material", prompt: "Kerf pada kalkulator potongan merujuk pada?", options: ["Lebar material yang termakan mata potong", "Tebal cat", "Diameter baut"], answer: "Lebar material yang termakan mata potong", explanation: "Kerf adalah lebar potongan yang hilang akibat mata gergaji." },
  { id: "q-shop", category: "konversi", prompt: "Nilai eksak 1 1/4 inch dalam mm adalah?", options: ["31,75 mm", "31,25 mm", "32,54 mm"], answer: "31,75 mm", explanation: "1,25 × 25,4 = 31,75 mm." },
  { id: "q-wood", category: "perkakas", prompt: "Jenis mata bor sebaiknya dipilih berdasarkan?", options: ["Material yang dibor", "Warna gagang", "Harga saja"], answer: "Material yang dibor", explanation: "Geometri dan material mata bor harus sesuai benda kerja." },
  { id: "q-conversion-trap", category: "konversi", prompt: "0,75 inch dikali 25,4 menghasilkan berapa mm?", options: ["19,05 mm", "1,905 mm", "25,4 mm"], answer: "19,05 mm", explanation: "0,75 × 25,4 = 19,05 mm." },
  { id: "q-leaf", category: "material", prompt: "Apakah ukuran nominal lembar panel menjamin ukuran aktual setiap merek?", options: ["Ya", "Tidak; ukur lembar aktual", "Hanya untuk MDF"], answer: "Tidak; ukur lembar aktual", explanation: "Ukuran dan toleransi dapat berbeda antar produk dan produsen." },
];

export const ACHIEVEMENTS = [
  { id: "first-quiz", title: "Mulai Belajar", description: "Selesaikan kuis pertama", icon: "spark" },
  { id: "ten-correct", title: "10 Konversi Benar", description: "Jawab 10 pertanyaan dengan benar", icon: "target" },
  { id: "fraction-master", title: "Master Pecahan", description: "Kuasai pecahan inci", icon: "ruler" },
  { id: "screw-detective", title: "Detektif Sekrup", description: "Pelajari kategori sekrup", icon: "screw" },
  { id: "hardware-king", title: "Jago Hardware", description: "Latihan lintas kategori", icon: "trophy" },
  { id: "streak-7", title: "Streak 7 Hari", description: "Belajar tujuh hari berturut-turut", icon: "flame" },
  { id: "learn-five", title: "Rajin Membaca", description: "Selesaikan 5 modul belajar", icon: "book" },
  { id: "daily", title: "Tantangan Harian", description: "Selesaikan tantangan hari ini", icon: "calendar" },
];

export const LEVELS = [
  { level: 1, name: "Pemula", xp: 0 }, { level: 2, name: "Penghafal Inci", xp: 100 }, { level: 3, name: "Ahli Pecahan", xp: 300 },
  { level: 4, name: "Kenal Sekrup", xp: 650 }, { level: 5, name: "Jago Hardware", xp: 1100 }, { level: 6, name: "Master Perkakas", xp: 1800 },
  { level: 7, name: "Ahli Ukuran Toko", xp: 2800 },
];

export const DATASET_COUNTS = {
  products: PRODUCTS_DATA.length, fractions: FRACTION_ROWS.length, learningModules: LEARNING_MODULES.length, quizQuestions: QUIZ_QUESTIONS.length,
  total: PRODUCTS_DATA.length + FRACTION_ROWS.length + LEARNING_MODULES.length + QUIZ_QUESTIONS.length,
};
