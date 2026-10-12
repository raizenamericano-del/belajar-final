"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle2, Clock3, Flame, Gamepad2, HelpCircle,
  Lightbulb, Package, RotateCcw, Ruler, ShieldCheck, Sparkles, Star, Target, Timer, Trophy, X, Zap,
} from "lucide-react";
import { ACHIEVEMENTS, FRACTION_ROWS, LEARNING_MODULES, PRODUCTS_DATA, QUIZ_QUESTIONS, type LearningModule, type Product, type QuizItem } from "@/lib/data";
import { easyCentimetres, formatConvertedValue, formatInches, formatNumber } from "@/lib/conversion";
import { getAccuracy, getLevel, localDateKey, type UserProgress } from "@/lib/progress";
import { PageTitle, ProductArt } from "@/components/ui";

export type GameCallbacks = {
  onAnswer: (correct: boolean, questionId: string, category: string, xp?: number) => void;
  onDailyComplete: () => void;
  onSpeedScore: (score: number) => void;
  notify: (message: string) => void;
};

export type Question = {
  id: string;
  category: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  imageKey?: string;
  visual?: "ruler";
  visualValue?: number;
  tag?: string;
};

type GameDefinition = {
  slug: string; title: string; short: string; description: string; Icon: LucideIcon;
  category: string; duration: string; accent: string;
};

export const GAMES: GameDefinition[] = [
  { slug: "guess-cm", title: "Tebak cm", short: "Ubah pecahan inci ke cm", description: "Latih ukuran toko yang sering disebut dalam sentimeter. Nilai jawaban memakai pembulatan praktis bertanda jelas.", Icon: Ruler, category: "KONVERSI", duration: "2 menit", accent: "linear-gradient(135deg,#f6db9e,#eab65d)" },
  { slug: "guess-inch", title: "Tebak inci", short: "Kenali pecahan di penggaris", description: "Pilih pecahan inci yang cocok dengan ukuran mm. Pecahan dan hasil hitung tetap ditampilkan tanpa mengubah kode barang.", Icon: Target, category: "PECAHAN", duration: "2 menit", accent: "linear-gradient(135deg,#e9dfbf,#cfb986)" },
  { slug: "guess-image", title: "Baca penggaris", short: "Baca tanda pada ilustrasi", description: "Lihat posisi garis pada skala ilustratif, lalu pilih bacaan terdekat. Gambar ini edukatif, bukan alat ukur nyata.", Icon: Ruler, category: "VISUAL", duration: "2 menit", accent: "linear-gradient(135deg,#d8e6d8,#abc6ae)" },
  { slug: "guess-product", title: "Tebak barang", short: "Cocokkan ilustrasi dan nama", description: "Kenali nama serta keluarga barang hardware dari ilustrasi katalog. Semua visual adalah ilustrasi, bukan foto produk.", Icon: Package, category: "KATALOG", duration: "3 menit", accent: "linear-gradient(135deg,#ead2bd,#cf9c6a)" },
  { slug: "screw-length", title: "Ukuran sekrup", short: "Pahami panjang dan kode", description: "Latih membaca panjang sekrup. Kode #6/#8 tidak dikonversi ke diameter mm tanpa tabel produk tepercaya.", Icon: Lightbulb, category: "SEKRUP", duration: "2 menit", accent: "linear-gradient(135deg,#e4d4bd,#c3a580)" },
  { slug: "true-false", title: "Benar atau salah", short: "Periksa fakta hardware", description: "Tantangan singkat seputar satuan, kode, material, dan keselamatan kerja.", Icon: ShieldCheck, category: "FAKTA", duration: "2 menit", accent: "linear-gradient(135deg,#d4e6df,#9ebead)" },
  { slug: "speed-quiz", title: "Speed quiz", short: "Jawab sebanyak mungkin", description: "45 detik untuk menguji kecepatan dan ketepatanmu. Bonus ronde diberikan setelah waktu habis.", Icon: Zap, category: "CEPAT", duration: "45 detik", accent: "linear-gradient(135deg,#f5d28e,#e99e3a)" },
  { slug: "memory-match", title: "Pasangkan ukuran", short: "Temukan pasangan kartu", description: "Cocokkan satuan dan fakta pengencang dengan jumlah langkah sesedikit mungkin.", Icon: Sparkles, category: "MEMORI", duration: "3 menit", accent: "linear-gradient(135deg,#ddd7ee,#afa2d1)" },
  { slug: "level-up", title: "Naik level", short: "Kuis bertahap", description: "Jalani satu set soal lintas topik, kumpulkan XP, dan lihat progres level lokalmu.", Icon: Trophy, category: "PROGRES", duration: "3 menit", accent: "linear-gradient(135deg,#f0d6a1,#d3a75b)" },
  { slug: "store-simulation", title: "Simulasi toko", short: "Bantu pembeli memilih", description: "Pilih jawaban paling aman saat pelanggan bertanya ukuran atau spesifikasi barang.", Icon: Package, category: "LAYANAN TOKO", duration: "3 menit", accent: "linear-gradient(135deg,#d5deda,#a8b6ac)" },
  { slug: "daily-challenge", title: "Tantangan harian", short: "10 pertanyaan campuran", description: "Selesaikan sepuluh soal hari ini untuk bonus +50 XP. Progres tersimpan pada perangkat ini.", Icon: Flame, category: "HARIAN", duration: "10 soal", accent: "linear-gradient(135deg,#f4c1a1,#e28b59)" },
  { slug: "practice", title: "Practice mode", short: "Latihan bebas dan soal salah", description: "Pilih campuran soal untuk berlatih. Tautan khusus dapat memutar ulang jawaban yang pernah keliru.", Icon: RotateCcw, category: "LATIHAN", duration: "bebas", accent: "linear-gradient(135deg,#d1e2e8,#9dbfca)" },
];

const inchSizes = FRACTION_ROWS.map((row) => row.inches);
const QUIZ_BY_ID = new Map(QUIZ_QUESTIONS.map((item) => [item.id, item]));

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function stableKey(value: unknown): string {
  if (value && typeof value === "object") {
    const record = value as { id?: unknown; slug?: unknown; term?: unknown };
    return String(record.id ?? record.slug ?? record.term ?? JSON.stringify(value));
  }
  return String(value);
}

/** Seeded ordering keeps server/browser previews deterministic and gives resets variety. */
function shuffle<T>(values: T[], seed = 0): T[] {
  return [...values].sort((a, b) => stableHash(`${stableKey(a)}:${seed}`) - stableHash(`${stableKey(b)}:${seed}`));
}

export function normalizeAnswer(value: string): string {
  const clean = value.trim().toLowerCase();
  if (["true", "benar", "betul", "ya"].includes(clean)) return "benar";
  if (["false", "salah", "tidak"].includes(clean)) return "salah";
  return clean.replace(/\s+/g, " ");
}

function makeOptions(answer: string, alternatives: string[]): string[] {
  const normalizedAnswer = normalizeAnswer(answer);
  const unique = Array.from(new Set(alternatives.filter((item) => normalizeAnswer(item) !== normalizedAnswer)));
  const enough = unique.slice(0, 3);
  while (enough.length < 3) enough.push(`Pilihan ${String.fromCharCode(65 + enough.length)}`);
  return shuffle([answer, ...enough]);
}

function fromQuizItem(item: QuizItem): Question {
  const binary = item.options.length === 2 || /benar|salah|pernyataan/i.test(item.prompt);
  const answer = normalizeAnswer(item.answer) === "benar" ? "Benar" : normalizeAnswer(item.answer) === "salah" ? "Salah" : item.answer;
  const options = binary
    ? ["Benar", "Salah"]
    : item.options;
  return { id: item.id, category: item.category, prompt: item.prompt, options, answer, explanation: item.explanation, imageKey: item.imageKey, tag: item.category.toUpperCase() };
}

export function buildQuestion(mode: string, index: number): Question {
  const idx = ((index % inchSizes.length) + inchSizes.length) % inchSizes.length;
  const row = FRACTION_ROWS[idx];
  if (mode === "guess-cm") {
    const cm = easyCentimetres(row.inches);
    const answer = `${formatNumber(cm, 1)} cm`;
    const options = makeOptions(answer, [cm + 0.6, cm - 0.5, cm + 1.4, cm + 2.3].map((value) => `${formatNumber(Math.max(0, value), 1)} cm`));
    return { id: `guess-cm-${row.inches}`, category: "pecahan inci", prompt: `Kira-kira berapa ${row.label} dalam sentimeter untuk hafalan toko?`, options, answer, explanation: `${row.label} ${formatConvertedValue(row.inches, "in", "cm").symbol} ${formatConvertedValue(row.inches, "in", "cm").text} cm; untuk hafalan toko ≈ ${answer}.`, tag: "TEBAK CM" };
  }
  if (mode === "guess-inch") {
    const answer = `${formatInches(row.inches)}″`;
    const alternatives = [FRACTION_ROWS[(idx + 1) % inchSizes.length], FRACTION_ROWS[(idx + 3) % inchSizes.length], FRACTION_ROWS[(idx + 6) % inchSizes.length], FRACTION_ROWS[(idx + 9) % inchSizes.length]].map((item) => `${formatInches(item.inches)}″`);
    return { id: `guess-inch-${row.inches}`, category: "pecahan inci", prompt: `Pilih bacaan inci yang setara dengan ≈ ${formatNumber(row.exactMm, 2)} mm.`, options: makeOptions(answer, alternatives), answer, explanation: `${row.label} = ${formatNumber(row.exactMm, 4)} mm secara eksak.`, tag: "TEBAK INCI" };
  }
  if (mode === "image-ruler") {
    const mm = FRACTION_ROWS[(idx + 5) % FRACTION_ROWS.length].exactMm;
    const label = `${formatNumber(mm, 2)} mm`;
    return { id: `image-ruler-${mm}`, category: "visual ukuran", prompt: "Lihat posisi penunjuk pada ilustrasi. Berapa bacaan skalanya?", options: makeOptions(label, [mm + 2.54, mm - 1.27, mm + 5.08, mm + 7.62].map((value) => `${formatNumber(Math.max(0, value), 2)} mm`)), answer: label, explanation: `Penunjuk berada di ${label}. Ilustrasi ini hanya latihan membaca skala, bukan alat ukur nyata.`, visual: "ruler", visualValue: mm, tag: "BACA ILUSTRASI" };
  }
  if (mode === "guess-image") {
    const diameters = [6, 8, 10, 12];
    const diameter = diameters[((index % diameters.length) + diameters.length) % diameters.length];
    const answer = `${diameter} mm`;
    return { id: "image-drill-diameter", category: "mata-bor", prompt: "Pada ilustrasi mata bor ini, ukuran yang ditandai adalah diameter nominal. Berapa ukurannya?", options: makeOptions(answer, [diameter + 2, Math.max(3, diameter - 2), diameter + 4].map((value) => `${value} mm`)),  answer, explanation: `Label pada ilustrasi latihan adalah ${answer}; diameter dan panjang keseluruhan adalah dimensi yang berbeda.`, imageKey: "drill-bit", tag: "TEBAK UKURAN" };
  }
  if (mode === "guess-product") {
    const products = PRODUCTS_DATA.filter((product) => product.imageKey && product.name);
    const product = products[((index % products.length) + products.length) % products.length];
    const distractors = products.filter((item) => item.slug !== product.slug && item.categoryId !== product.categoryId).slice(index, index + 4);
    const fallback = products.filter((item) => item.slug !== product.slug).slice(0, 4);
    const options = makeOptions(product.name, [...distractors, ...fallback].map((item) => item.name));
    return { id: `product-${index}`, category: product.categoryId, prompt: `Apa nama barang yang diilustrasikan? Kode contoh: ${product.code}.`, options, answer: product.name, explanation: `${product.name} termasuk kategori ${product.subcategory}. Entri dan gambarnya adalah contoh referensi; cocokkan barang aktual dengan labelnya.`, imageKey: product.imageKey, tag: "TEBAK BARANG" };
  }
  if (mode === "screw-length") {
    const screws = PRODUCTS_DATA.filter((product) => product.categoryId === "sekrup" && product.lengthIn !== undefined);
    const product = screws[((index % Math.max(1, screws.length)) + screws.length) % Math.max(1, screws.length)];
    const length = product?.lengthIn ?? inchSizes[idx];
    const cm = easyCentimetres(length);
    const answer = `${formatNumber(cm, 1)} cm`;
    const label = product?.code ?? `${formatInches(length)}″`;
    return { id: `screw-length-${product?.slug ?? "sample"}`, category: "sekrup", prompt: `Untuk panjang nominal ${label}, berapa kira-kira padanannya dalam cm?`, options: makeOptions(answer, [cm + 0.6, cm + 1.3, Math.max(0.1, cm - 0.9), cm + 2.1].map((value) => `${formatNumber(value, 1)} cm`)), answer, explanation: `${formatInches(length)}″ ${formatConvertedValue(length, "in", "mm").symbol} ${formatConvertedValue(length, "in", "mm").text} mm; untuk hafalan toko ≈ ${answer}. Kode # pada diameter sekrup tidak diubah menjadi mm tanpa sumber spesifikasi.`, imageKey: "screw", tag: "UKURAN SEKRUP" };
  }
  if (mode === "store-simulation") {
    const storeIds = ["q-34", "q-m8", "q-screw6", "q-fisher", "q-bit", "q-safety"];
    const source = QUIZ_BY_ID.get(storeIds[index % storeIds.length]) ?? QUIZ_QUESTIONS[0];
    return { ...fromQuizItem(source), id: `store-${index % storeIds.length}`, tag: "SIMULASI TOKO" };
  }
  return fromQuizItem(QUIZ_QUESTIONS[idx % QUIZ_QUESTIONS.length]);
}

export function questionFromWrongId(id: string, index: number): Question | null {
  const bankItem = QUIZ_QUESTIONS.find((item) => item.id === id);
  if (bankItem) return fromQuizItem(bankItem);
  if (id.startsWith("guess-cm-")) {
    const value = Number(id.slice("guess-cm-".length));
    const idx = inchSizes.findIndex((size) => Math.abs(size - value) < 1e-8);
    if (idx >= 0) return buildQuestion("guess-cm", idx);
  }
  if (id.startsWith("guess-inch-")) {
    const value = Number(id.slice("guess-inch-".length));
    const idx = inchSizes.findIndex((size) => Math.abs(size - value) < 1e-8);
    if (idx >= 0) return buildQuestion("guess-inch", idx);
  }
  if (id.startsWith("image-ruler-")) {
    const mm = Number(id.slice("image-ruler-".length));
    const label = `${formatNumber(mm, 2)} mm`;
    return { id, category: "visual ukuran", prompt: "Ulangi bacaan skala pada ilustrasi. Berapa posisi tanda?", options: makeOptions(label, [mm + 2.54, Math.max(0, mm - 1.27), mm + 5.08].map((value) => `${formatNumber(value, 2)} mm`)),  answer: label, explanation: `Bacaan pada ilustrasi adalah ${label}. Ilustrasi ini bukan alat ukur nyata.`, visual: "ruler", visualValue: mm, tag: "ULANG BACA SKALA" };
  }
  if (id === "image-drill-diameter") return buildQuestion("guess-image", 1);
  if (id.startsWith("product-")) { const savedIndex = Number(id.slice("product-".length)); return buildQuestion("guess-product", Number.isFinite(savedIndex) ? savedIndex : index); }
  if (id.startsWith("screw-length-")) {
    const product = PRODUCTS_DATA.find((item) => item.slug === id.slice("screw-length-".length));
    if (product?.lengthIn !== undefined) {
      const cm = easyCentimetres(product.lengthIn);
      const answer = `${formatNumber(cm, 1)} cm`;
      return { id, category: "sekrup", prompt: `Berapa panjang ${product.code} kira-kira dalam cm?`, options: makeOptions(answer, [`${formatNumber(cm + 0.8, 1)} cm`, `${formatNumber(Math.max(0.1, cm - 0.6), 1)} cm`, `${formatNumber(cm + 1.3, 1)} cm`]), answer, explanation: `${formatInches(product.lengthIn)}″ ${formatConvertedValue(product.lengthIn, "in", "mm").symbol} ${formatConvertedValue(product.lengthIn, "in", "mm").text} mm. Kode ${product.diameterCode ?? "diameter"} tidak diubah ke mm tanpa referensi.`, imageKey: "screw", tag: "ULANG UKURAN SEKRUP" };
    }
  }
  if (id.startsWith("store-")) {
    for (let i = 0; i < 6; i++) { const question = buildQuestion("store-simulation", i); if (question.id === id) return question; }
  }
  if (id.startsWith("learn-")) {
    const module = LEARNING_MODULES.find((item) => `learn-${item.slug}` === id);
    if (module) return fromLearningModule(module, id);
  }
  return null;
}

function fromLearningModule(module: LearningModule, id = `learn-${module.slug}`): Question {
  return { id, category: module.category.toLowerCase().includes("sekrup") ? "sekrup" : module.category.toLowerCase(), prompt: module.question, options: module.options, answer: module.answer, explanation: module.explanation, imageKey: module.imageKey, tag: "ULANG MATERI" };
}

export function deckForGame(game: string): Question[] {
  if (game === "guess-cm") return Array.from({ length: 10 }, (_, i) => buildQuestion("guess-cm", (i * 2 + 1) % inchSizes.length));
  if (game === "guess-inch") return Array.from({ length: 10 }, (_, i) => buildQuestion("guess-inch", (i * 3 + 2) % inchSizes.length));
  if (game === "guess-image") return Array.from({ length: 8 }, (_, i) => buildQuestion("image-ruler", i + 2));
  if (game === "guess-product") return Array.from({ length: 10 }, (_, i) => buildQuestion("guess-product", i * 7));
  if (game === "screw-length") return Array.from({ length: 10 }, (_, i) => buildQuestion("screw-length", i * 3));
  if (game === "true-false") return shuffle(QUIZ_QUESTIONS.filter((item) => item.options.length === 2 || /benar|salah|pernyataan/i.test(item.prompt))).slice(0, 10).map(fromQuizItem);
  if (game === "level-up") return shuffle(QUIZ_QUESTIONS).slice(0, 8).map(fromQuizItem);
  if (game === "store-simulation") return Array.from({ length: 6 }, (_, i) => buildQuestion("store-simulation", i));
  if (game === "daily-challenge") {
    const ids = ["q-34", "q-inch-mm", "q-m8", "q-screw6", "q-bit", "q-sheet", "q-fisher", "q-safety", "q-kerf", "q-114"];
    return ids.map((id) => { const item = QUIZ_BY_ID.get(id); return item ? fromQuizItem(item) : fromQuizItem(QUIZ_QUESTIONS[0]); });
  }
  if (game === "speed-quiz") return Array.from({ length: 4 }, () => shuffle(QUIZ_QUESTIONS).map(fromQuizItem)).flat();
  return shuffle(QUIZ_QUESTIONS).slice(0, 10).map(fromQuizItem);
}

function RulerIllustration({ value }: { value: number }) {
  const x = 34 + (Math.min(Math.max(value, 0), 80) / 80) * 632;
  return <div className="ruler-question"><svg viewBox="0 0 700 126" role="img" aria-label={`Ilustrasi skala dengan penunjuk sekitar ${formatNumber(value, 2)} milimeter`}>
    <rect x="13" y="22" width="674" height="86" rx="10" fill="currentColor" opacity=".08" />
    <line x1="34" y1="84" x2="666" y2="84" stroke="currentColor" strokeWidth="2" opacity=".7" />
    {Array.from({ length: 33 }, (_, i) => { const px = 34 + i * (632 / 32); const tall = i % 4 === 0; return <g key={i}><line x1={px} y1={tall ? 40 : 59} x2={px} y2="84" stroke="currentColor" strokeWidth={tall ? 2 : 1} opacity={tall ? .75 : .48} />{tall && <text x={px} y="101" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".8">{i * 2.5}</text>}</g>; })}
    <path d={`M ${x} 13 L ${x - 8} 27 L ${x + 8} 27 Z`} fill="#dc842b" /><line x1={x} y1="27" x2={x} y2="83" stroke="#dc842b" strokeWidth="2" strokeDasharray="3 3" />
    <text x="351" y="120" textAnchor="middle" fontSize="9" fill="currentColor" opacity=".65">ILUSTRASI PENGGARIS · skala contoh, bukan alat ukur nyata</text>
  </svg><small>Perhatikan posisi penunjuk terhadap skala.</small></div>;
}

function GameHome({ progress }: { progress: UserProgress }) {
  const level = getLevel(progress.xp);
  const unlocked = new Set(progress.earnedBadges);
  return <div className="page-stack game-center-page">
    <section className="arcade-hero"><div className="arcade-hero-copy"><span className="eyebrow">KAYUUKUR ARCADE · BELAJAR SAMBIL PRAKTIK</span><h1>Asah insting ukuranmu.</h1><p>Dua belas permainan singkat untuk hafal pecahan, mengenali barang toko, dan melayani pertanyaan dengan percaya diri. Semua progres tersimpan lokal di perangkat ini.</p><div className="arcade-badges"><span><Zap size={13} /> XP lokal</span><span><Ruler size={13} /> 12 mode permainan</span><span><ShieldCheck size={13} /> Jawaban beralasan</span></div></div><div className="arcade-avatar"><Gamepad2 size={55} /><span className="arcade-orbit orbit-a"><Star size={13} /></span><span className="arcade-orbit orbit-b"><Ruler size={12} /></span><span className="arcade-orbit orbit-c"><Zap size={12} /></span></div></section>

    {progress.wrongQuestionIds.length > 0 && <section className="mistake-banner"><span className="mistake-icon"><Target size={21} /></span><div><b>Balik lagi ke soal yang sempat keliru</b><p>{progress.wrongQuestionIds.length} soal menunggu untuk dicoba ulang. Jawaban benar akan menghapusnya dari daftar.</p></div><Link className="button button-outline" href="/games/practice?focus=wrong">Ulangi soal <ArrowRight size={15} /></Link></section>}

    <div className="game-center-heading"><div><span className="eyebrow">PILIH MODE</span><h2>Permainan singkat, progres terasa</h2></div><span className="section-caption">Pilih satu untuk mulai</span></div>
    <div className="game-card-grid">{GAMES.map((game, index) => <Link href={`/games/${game.slug}`} className="game-card" key={game.slug}><div className="game-card-art" style={{ background: game.accent }}><span className="game-card-number">MODE {String(index + 1).padStart(2, "0")}</span><span className="game-card-illustration"><game.Icon size={29} /></span><span className="game-card-stars">✦</span></div><div className="game-card-info"><small>{game.category} · {game.duration.toUpperCase()}</small><h3>{game.title}</h3><p>{game.short}</p><span className="text-link">Mainkan <ArrowRight size={13} /></span></div></Link>)}</div>

    <div className="arcade-bottom-grid"><section className="panel"><div className="section-heading"><div><span className="eyebrow">RINGKASAN BELAJAR</span><h2>Progresmu</h2></div><Link href="/profile" className="text-link">Profil <ArrowRight size={14} /></Link></div><div className="arcade-stats"><div><b>{progress.xp.toLocaleString("id-ID")}</b><span>Total XP</span></div><div><b>{getAccuracy(progress)}%</b><span>Akurasi</span></div><div><b>{progress.streak}</b><span>Hari streak</span></div></div><div className="level-progress-box"><div><span>LEVEL {level.level} · {level.name}</span><b>{level.next ? `${level.remaining} XP lagi` : "Maksimum"}</b></div><div className="progress-track"><span style={{ width: `${level.progress}%` }} /></div><small>{progress.correct} benar dari {progress.answered} jawaban</small></div></section>
      <section className="badge-panel"><span className="badge-icon"><Award size={21} /></span><div><span className="eyebrow">LENCANA BELAJAR</span><h3>{unlocked.size} dari {ACHIEVEMENTS.length} lencana</h3><p>Latihan lintas topik untuk membuka semua lencana. Jawaban, XP, dan streak tersimpan di browser.</p><div className="badge-meter"><span style={{ width: `${Math.min(100, (unlocked.size / ACHIEVEMENTS.length) * 100)}%` }} /></div><div className="game-badge-mini-list">{ACHIEVEMENTS.slice(0, 4).map((badge) => <span key={badge.id} title={badge.description} className={unlocked.has(badge.id) ? "earned" : "locked"}>{unlocked.has(badge.id) ? <CheckCircle2 size={14} /> : <Star size={14} />} {badge.title}</span>)}</div></div></section></div>
  </div>;
}

function QuizCard({ game, question, index, total, selected, onSelect, correctCount, timeLeft, answerCount, focusWrong }: {
  game: GameDefinition; question: Question; index: number; total: number; selected: string | null; onSelect: (answer: string) => void;
  correctCount: number; timeLeft: number; answerCount: number; focusWrong: boolean;
}) {
  const correctOption = (value: string) => normalizeAnswer(value) === normalizeAnswer(question.answer);
  const isBinary = question.options.length === 2;
  return <section className="quiz-card"><div className="quiz-progress-header"><span className="quiz-type-tag">{question.tag ?? game.category}</span><span className="quiz-index">{index + 1} <small>/ {total}</small></span></div>
    {game.slug === "daily-challenge" && <div className="daily-quiz-progress"><span>{answerCount} dari 10 soal harian</span><div className="progress-track"><span style={{ width: `${Math.min(100, (answerCount / 10) * 100)}%` }} /></div></div>}
    {game.slug === "speed-quiz" && <div className="speed-status"><span className={`timer-pill ${timeLeft <= 10 ? "urgent" : ""}`}><Timer size={14} /> 00:{String(timeLeft).padStart(2, "0")}</span><div className="speed-track"><span style={{ width: `${(timeLeft / 45) * 100}%` }} /></div><span className="combo-pill"><Zap size={13} /> {correctCount} benar</span></div>}
    <h2>{question.prompt}</h2>
    {question.visual === "ruler" && question.visualValue !== undefined && <RulerIllustration value={question.visualValue} />}
    {question.imageKey && <div className="quiz-product-image"><ProductArt imageKey={question.imageKey} alt={`Ilustrasi ${question.tag?.toLowerCase() ?? "barang"}`} /></div>}
    <div className={`answer-options ${isBinary ? "two-options" : ""}`}>{question.options.map((option, optionIndex) => {
      const chosen = selected !== null && normalizeAnswer(option) === normalizeAnswer(selected);
      const correct = correctOption(option);
      const state = selected === null ? "" : correct ? "correct" : chosen ? "wrong" : "";
      return <button key={`${option}-${optionIndex}`} className={`answer-option ${state}`} disabled={selected !== null} onClick={() => onSelect(option)}><span className="option-letter">{isBinary ? optionIndex === 0 ? "✓" : "×" : String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{selected !== null && correct && <Check size={16} />}{selected !== null && chosen && !correct && <X size={16} className="wrong-mark" />}</button>;
    })}</div>
    {selected !== null && <div className={`answer-feedback ${normalizeAnswer(selected) === normalizeAnswer(question.answer) ? "feedback-correct" : "feedback-wrong"}`}><div className="feedback-heading">{normalizeAnswer(selected) === normalizeAnswer(question.answer) ? <><CheckCircle2 size={16} /> Tepat! +10 XP</> : <><Lightbulb size={16} /> Belum tepat — kita pelajari</>}</div><p>{question.explanation}</p>{game.slug !== "speed-quiz" && <button className="button button-primary" onClick={() => onSelect("__next__")}>Lanjut <ArrowRight size={15} /></button>}</div>}
    {focusWrong && <p className="game-footnote"><RotateCcw size={14} /> Jawaban benar akan menghapus soal ini dari daftar latihan ulang.</p>}
  </section>;
}

function RoundSummary({ game, correct, answered, onRestart, focusWrong, dailyAlreadyCompleted = false }: { game: GameDefinition; correct: number; answered: number; onRestart: () => void; focusWrong: boolean; dailyAlreadyCompleted?: boolean }) {
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  return <section className="round-summary"><span className="summary-medal"><Trophy size={30} /></span><span className="eyebrow">RONDE SELESAI</span><h2>{correct >= Math.ceil(answered * 0.8) ? "Kerja bagus!" : "Latihan bikin makin mantap."}</h2><p>{focusWrong ? "Soal yang sudah dijawab benar dihapus dari daftar salah." : `Kamu menyelesaikan mode ${game.title.toLowerCase()}.`}</p><div className="speed-result-row"><span><b>{correct}/{answered}</b><small>Jawaban benar</small></span><span><b>{accuracy}%</b><small>Akurasi ronde</small></span><span><b>+{correct * 10}</b><small>XP benar</small></span></div>{game.slug === "daily-challenge" && <div className="daily-finish-reward"><Zap size={15} /> {dailyAlreadyCompleted ? "Bonus harian sudah diklaim hari ini." : "Bonus harian +50 XP ditambahkan."}</div>}<div className="round-actions"><button className="button button-primary" onClick={onRestart}><RotateCcw size={15} /> Main lagi</button><Link href="/games" className="button button-outline"><ArrowLeft size={15} /> Game Center</Link></div></section>;
}

function QuizGame({ game, progress, callbacks }: { game: GameDefinition; progress: UserProgress; callbacks: GameCallbacks }) {
  const [deck, setDeck] = useState<Question[]>(() => deckForGame(game.slug));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [roundDone, setRoundDone] = useState(false);
  const [focusWrong, setFocusWrong] = useState(false);
  const replayPrepared = useRef(false);
  const speedBonusPaid = useRef(false);
  const dailyBonusPaid = useRef(false);
  const advanceTimer = useRef<number | null>(null);
  const isSpeed = game.slug === "speed-quiz";
  const isDaily = game.slug === "daily-challenge";
  const dailyAlreadyCompleted = isDaily && progress.dailyDate === localDateKey() && progress.dailyCompleted;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const replay = game.slug === "practice" && new URLSearchParams(window.location.search).get("focus") === "wrong";
    if (!replay) return;
    setFocusWrong(true);
    if (!replayPrepared.current) {
      const questions = progress.wrongQuestionIds.map((id, idx) => questionFromWrongId(id, idx)).filter((item): item is Question => item !== null);
      setDeck(questions);
      if (progress.wrongQuestionIds.length > 0 || progress.answered > 0) replayPrepared.current = true;
    }
  }, [game.slug, progress.wrongQuestionIds, progress.answered]);

  useEffect(() => {
    if (!isSpeed || roundDone) return;
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isSpeed, roundDone]);

  useEffect(() => {
    if (timeLeft === 0 && isSpeed && !roundDone) setRoundDone(true);
  }, [timeLeft, isSpeed, roundDone]);

  useEffect(() => {
    if (roundDone && isSpeed && !speedBonusPaid.current) { speedBonusPaid.current = true; callbacks.onSpeedScore(correctCount); }
  }, [roundDone, isSpeed, correctCount, callbacks]);

  useEffect(() => {
    if (roundDone && isDaily && answerCount >= 10 && !dailyAlreadyCompleted && !dailyBonusPaid.current) { dailyBonusPaid.current = true; callbacks.onDailyComplete(); }
  }, [roundDone, isDaily, dailyAlreadyCompleted, answerCount, callbacks]);

  useEffect(() => {
    if (roundDone && advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    return () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); };
  }, [roundDone]);

  const question = deck[index];
  const title = focusWrong ? "Ulangi soal yang keliru" : game.title;
  const description = focusWrong ? `${deck.length} soal yang sebelumnya salah — jawab lagi dengan tenang.` : game.description;

  function completeRound() { setRoundDone(true); }
  function advance() {
    if (index + 1 < deck.length) { setIndex((value) => value + 1); setSelected(null); }
    else completeRound();
  }
  function answer(option: string) {
    if (option === "__next__") { advance(); return; }
    if (!question || selected !== null || roundDone) return;
    setSelected(option);
    const correct = normalizeAnswer(option) === normalizeAnswer(question.answer);
    setAnswerCount((value) => value + 1);
    if (correct) setCorrectCount((value) => value + 1);
    callbacks.onAnswer(correct, question.id, question.category);
    if (isSpeed) {
      advanceTimer.current = window.setTimeout(() => { setSelected(null); if (index + 1 >= deck.length) setRoundDone(true); else setIndex(index + 1); }, 650);
    }
  }
  function restart() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setDeck(focusWrong ? progress.wrongQuestionIds.map((id, idx) => questionFromWrongId(id, idx)).filter((item): item is Question => item !== null) : deckForGame(game.slug));
    setIndex(0); setSelected(null); setCorrectCount(0); setAnswerCount(0); setTimeLeft(45); setRoundDone(false); speedBonusPaid.current = false; dailyBonusPaid.current = false;
  }

  if (focusWrong && deck.length === 0) return <div className="page-stack"><div className="game-page-heading"><div><span className="eyebrow">LATIHAN ULANG</span><h1>Tidak ada soal yang perlu diulang</h1><p>Semua soal yang pernah keliru sudah terjawab benar, atau tidak lagi tersedia.</p></div></div><div className="round-actions"><Link href="/games" className="button button-primary"><ArrowLeft size={15} /> Kembali ke Game Center</Link><Link href="/games/practice" className="button button-outline">Latihan bebas <ArrowRight size={15} /></Link></div></div>;

  if (roundDone || !question) return <div className="page-stack"><div className="game-page-heading"><div><span className="eyebrow">{game.category} · SELESAI</span><h1>{title}</h1><p>{description}</p></div><div className="game-score-bubble"><Trophy size={16} /><b>{correctCount * 10} XP</b><small>hasil ronde</small></div></div><RoundSummary game={game} correct={correctCount} answered={answerCount} onRestart={restart} focusWrong={focusWrong} dailyAlreadyCompleted={dailyAlreadyCompleted} /></div>;

  const total = isSpeed ? deck.length : deck.length;
  return <div className="page-stack"><div className="game-page-heading"><div><Link href="/games" className="text-link"><ArrowLeft size={14} /> Game Center</Link><span className="eyebrow">{focusWrong ? "PRACTICE MODE · SOAL SALAH" : `${game.category} · ${game.duration.toUpperCase()}`}</span><h1>{title}</h1><p>{description}</p></div><div className="game-score-bubble"><Zap size={16} /><b>{correctCount * 10} XP</b><small>{correctCount} benar · {answerCount} dijawab</small></div></div>
    <QuizCard game={game} question={question} index={index} total={total} selected={selected} onSelect={answer} correctCount={correctCount} timeLeft={timeLeft} answerCount={answerCount} focusWrong={focusWrong} />
    {!focusWrong && <p className="game-footnote"><ShieldCheck size={14} /> Jawaban dan alasan di dalam game adalah bahan latihan. Cek spesifikasi aktual pada label atau datasheet.</p>}
  </div>;
}

type MemoryCard = { id: string; pair: string; term: string; side: string };
const MEMORY_PAIRS = [
  ["satuan-inci", "1 inch", "25,4 mm"], ["pecahan-tiga-per-empat", "3/4 inch", "19,05 mm"], ["satuan-kaki", "1 ft", "12 inch"],
  ["satuan-cm", "1 cm", "10 mm"], ["kode-m8", "M8", "diameter nominal ulir 8 mm"], ["pecahan-satu-seperempat", "1 1/4 inch", "31,75 mm"],
] as const;

function MemoryGame({ callbacks }: { callbacks: GameCallbacks }) {
  const [cards, setCards] = useState<MemoryCard[]>(() => shuffle(MEMORY_PAIRS.flatMap(([pair, left, right]) => [{ id: `${pair}-a`, pair, term: left, side: "UKURAN" }, { id: `${pair}-b`, pair, term: right, side: "PADANAN" }])));
  const [opened, setOpened] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const score = matched.length / 2;

  useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);
  function flip(card: MemoryCard) {
    if (locked || done || matched.includes(card.id) || opened.includes(card.id)) return;
    const next = [...opened, card.id]; setOpened(next);
    if (next.length !== 2) return;
    setMoves((value) => value + 1);
    const first = cards.find((item) => item.id === next[0]);
    if (first?.pair === card.pair) {
      setLocked(true);
      timeoutRef.current = window.setTimeout(() => {
        const updated = [...matched, ...next];
        setMatched(updated);
        if (updated.length === cards.length) setDone(true);
        setOpened([]); setLocked(false);
        callbacks.onAnswer(true, `memory-${card.pair}`, "memori", 10);
      }, 320);
    } else {
      setLocked(true);
      timeoutRef.current = window.setTimeout(() => { setOpened([]); setLocked(false); }, 750);
    }
  }
  function restart() {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setCards(shuffle(MEMORY_PAIRS.flatMap(([pair, left, right]) => [{ id: `${pair}-a`, pair, term: left, side: "UKURAN" }, { id: `${pair}-b`, pair, term: right, side: "PADANAN" }]), Date.now()));
    setOpened([]); setMatched([]); setMoves(0); setLocked(false); setDone(false);
  }
  return <div className="page-stack"><div className="game-page-heading"><div><Link href="/games" className="text-link"><ArrowLeft size={14} /> Game Center</Link><span className="eyebrow">MEMORI · 6 PASANGAN</span><h1>Pasangkan ukuran</h1><p>Cari pasangan yang benar. Cocokkan satuan dan fakta hardware.</p></div><div className="game-score-bubble"><Sparkles size={16} /><b>{score * 10} XP</b><small>{score} dari 6 pasangan</small></div></div>
    <div className="memory-stats"><span><b>{moves}</b> langkah</span><span><b>{6 - score}</b> pasangan tersisa</span><span><b>{score * 10}</b> XP</span><button className="button button-outline" onClick={restart}><RotateCcw size={14} /> Ulangi</button></div>
    <div className="memory-board">{cards.map((card) => { const visible = opened.includes(card.id) || matched.includes(card.id); const isMatched = matched.includes(card.id); return <button key={card.id} className={`memory-card ${visible ? "revealed" : ""} ${isMatched ? "matched" : ""}`} onClick={() => flip(card)} aria-label={visible ? `${card.side}: ${card.term}` : "Kartu tertutup"} aria-pressed={visible}><span className="memory-back">K</span><span className="memory-front"><small>{card.side}</small><b>{card.term}</b>{isMatched && <i><CheckCircle2 size={15} /></i>}</span></button>; })}</div>
    {done && <div className="memory-success"><CheckCircle2 size={20} /><div><b>Semua pasangan cocok!</b><span>Selesaikan dalam {moves} langkah. +60 XP dari enam pasangan.</span></div><button className="text-link" onClick={restart}>Main lagi <ArrowRight size={13} /></button></div>}
    <p className="game-footnote"><ShieldCheck size={14} /> Pasangan yang dipakai berisi fakta satuan dan hardware untuk latihan.</p>
  </div>;
}

export function GameCenterPage({ path, progress, callbacks }: { path: string; progress: UserProgress; callbacks: GameCallbacks }) {
  const slug = path.replace(/^\/games\/?/, "").split("/")[0];
  if (!slug) return <GameHome progress={progress} />;
  const game = GAMES.find((item) => item.slug === slug);
  if (!game) return <div className="page-stack"><PageTitle eyebrow="GAME CENTER" title="Permainan tidak ditemukan" subtitle="Pilih mode lain dari Game Center." /><Link href="/games" className="button button-primary"><ArrowLeft size={15} /> Kembali ke permainan</Link></div>;
  if (game.slug === "memory-match") return <MemoryGame callbacks={callbacks} />;
  return <QuizGame key={game.slug} game={game} progress={progress} callbacks={callbacks} />;
}
