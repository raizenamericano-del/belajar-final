export type ProductValidationInput = { name?: unknown; slug?: unknown; category_id?: unknown; code?: unknown; verification?: unknown; length_mm?: unknown; thickness_mm?: unknown };

export function validateProductInput(input: ProductValidationInput): { valid: true } | { valid: false; reason: string } {
  const name = String(input.name ?? "").trim();
  const slug = String(input.slug ?? "").trim();
  const category = String(input.category_id ?? "").trim();
  const code = String(input.code ?? "").trim();
  if (!name || !slug || !category || !code) return { valid: false, reason: "Nama, slug, kategori, dan kode ukuran wajib diisi." };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { valid: false, reason: "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung." };
  if (name.length > 160 || code.length > 100) return { valid: false, reason: "Nama atau kode melebihi batas karakter." };
  const verification = String(input.verification ?? "example");
  if (!["example", "verified", "mathematical"].includes(verification)) return { valid: false, reason: "Status verifikasi tidak dikenal." };
  for (const [field, label] of [["length_mm", "Panjang"], ["thickness_mm", "Ketebalan"]] as const) {
    const value = input[field];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100000) return { valid: false, reason: `${label} harus angka non-negatif yang masuk akal.` };
    }
  }
  return { valid: true };
}

export function validateQuizInput(input: { prompt?: string; options?: string[]; answer?: string }) {
  const options = (input.options ?? []).map((option) => option.trim()).filter(Boolean);
  if (!input.prompt?.trim()) return { valid: false as const, reason: "Pertanyaan wajib diisi." };
  if (options.length < 2) return { valid: false as const, reason: "Kuis memerlukan minimal dua pilihan." };
  if (!input.answer?.trim() || !options.includes(input.answer.trim())) return { valid: false as const, reason: "Jawaban benar harus sama dengan salah satu pilihan." };
  return { valid: true as const };
}
