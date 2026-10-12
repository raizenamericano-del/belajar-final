import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the local shell. Never use the service-role key in NEXT_PUBLIC_* or commit it.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const data = JSON.parse(await readFile(new URL("../supabase/seed-data.json", import.meta.url), "utf8"));
const chunked = (items, size = 100) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
function deterministicUuid(key) {
  const hex = createHash("sha256").update(`kayuukur-pro:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  const raw = hex.join("");
  return `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`;
}
async function upsertChunks(table, rows, onConflict) {
  for (const part of chunked(rows)) {
    const { error } = await supabase.from(table).upsert(part, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`✓ ${table}: ${rows.length} rows`);
}

try {
  await upsertChunks("categories", data.categories, "id");
  await upsertChunks("unit_conversions", data.unitConversions, "from_unit,to_unit");
  await upsertChunks("products", data.products, "slug");
  await upsertChunks("learning_modules", data.learningModules, "slug");
  await upsertChunks("achievements", data.achievements, "id");
  const { data: quiz, error: quizError } = await supabase.from("quizzes")
    .upsert({ slug: "kayuukur-bank-soal", title: "Bank soal KayuUkur Pro", description: "Soal latihan ukuran dan pengenalan hardware." }, { onConflict: "slug" })
    .select("id").single();
  if (quizError) throw new Error(`quizzes: ${quizError.message}`);
  const questions = data.quizQuestions.map(({ seed_key, ...question }) => ({ ...question, id: deterministicUuid(seed_key), quiz_id: quiz.id }));
  await upsertChunks("quiz_questions", questions, "id");
  console.log(`Seed selesai. Dataset awal: ${data.meta.counts.products} produk + ${data.meta.counts.categories} kategori + ${data.meta.counts.learningModules} materi + ${data.meta.counts.quizQuestions} soal + ${data.meta.counts.fractionReferences} referensi pecahan.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
