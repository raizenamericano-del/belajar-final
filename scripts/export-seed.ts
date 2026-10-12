import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATEGORIES, PRODUCTS_DATA, LEARNING_MODULES, QUIZ_QUESTIONS, ACHIEVEMENTS, FRACTION_ROWS } from "../lib/data";
import { TO_MM, type Unit } from "../lib/conversion";

const units: Unit[] = ["in", "ft", "m", "cm", "mm"];
const conversions = units.flatMap((from_unit) => units.filter((to_unit) => from_unit !== to_unit).map((to_unit) => ({
  from_unit, to_unit, factor: TO_MM[from_unit] / TO_MM[to_unit], exact: true,
  note: from_unit === "in" && to_unit === "mm" ? "1 inch = 25,4 mm (eksak)" : "Faktor konversi unit eksak; pembulatan hanya pada UI.",
})));
const products = PRODUCTS_DATA.map((product) => ({
  slug: product.slug, category_id: product.categoryId, name: product.name, subcategory: product.subcategory, code: product.code,
  image_key: product.imageKey, description: product.description, uses: product.uses, note: product.note,
  verification: product.verification, aliases: product.aliases,
  specifications: {
    ...(product.lengthIn !== undefined ? { length_in: product.lengthIn, length_mm: Number((product.lengthIn * 25.4).toFixed(4)) } : {}),
    ...(product.lengthMm !== undefined ? { length_mm: product.lengthMm } : {}),
    ...(product.widthMm !== undefined ? { width_mm: product.widthMm } : {}),
    ...(product.thicknessMm !== undefined ? { thickness_mm: product.thicknessMm } : {}),
    ...(product.nominalDiameterMm !== undefined ? { nominal_diameter_mm: product.nominalDiameterMm } : {}),
    ...(product.diameterCode ? { diameter_code: product.diameterCode } : {}),
    ...(product.sheetSize ? { sheet_size_note: product.sheetSize } : {}),
    ...(product.headType ? { head_type: product.headType } : {}),
    ...(product.threadType ? { thread_type: product.threadType } : {}),
    ...(product.finish ? { finish: product.finish } : {}),
    ...(product.material ? { material: product.material } : {}),
  }, is_published: true,
}));
const modules = LEARNING_MODULES.map((module) => ({
  slug: module.slug, title: module.title, category: module.category, minutes: module.minutes, image_key: module.imageKey,
  intro: module.intro, body: module.body, takeaway: module.takeaway,
  question: { prompt: module.question, options: module.options, answer: module.answer, explanation: module.explanation }, is_published: true,
}));
const questions = QUIZ_QUESTIONS.map((question) => ({
  seed_key: question.id, category: question.category, prompt: question.prompt, options: question.options,
  answer: question.answer, explanation: question.explanation, image_key: question.imageKey ?? null, is_published: true,
}));
const data = {
  meta: { app: "KayuUkur Pro", createdAt: new Date().toISOString(), counts: { categories: CATEGORIES.length, products: products.length, fractionReferences: FRACTION_ROWS.length, learningModules: modules.length, quizQuestions: questions.length, achievements: ACHIEVEMENTS.length, unitConversions: conversions.length } },
  categories: CATEGORIES.map(({ id, slug, name, description, imageKey }) => ({ id, slug, name, description, image_key: imageKey, is_published: true })),
  products, unitConversions: conversions, learningModules: modules, quizQuestions: questions,
  achievements: ACHIEVEMENTS.map((item) => ({ id: item.id, title: item.title, description: item.description, icon: item.icon, xp_reward: 0 })),
  fractionReferences: FRACTION_ROWS,
};
async function main() {
  const outDir = join(process.cwd(), "supabase");
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "seed-data.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Exported ${products.length} products, ${modules.length} modules, ${questions.length} questions and ${CATEGORIES.length} categories to supabase/seed-data.json.`);
}
void main();
