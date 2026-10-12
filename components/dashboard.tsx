"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, ArrowUpRight, BookOpen, Boxes, Calculator, Flame, Gamepad2, Heart, History, MoveUpRight,
  Ruler, Search, ShieldCheck, Sparkles, Target, Trophy, Zap, CircleHelp, Wrench,
} from "lucide-react";
import { convert, easyCentimetres, formatNumber, parseMeasurement } from "@/lib/conversion";
import { CATEGORIES, FRACTION_ROWS, LEARNING_MODULES, PRODUCTS_DATA, type Category, type Product } from "@/lib/data";
import { getAccuracy, getLevel, type UserProgress } from "@/lib/progress";
import { ProductArt, ProductCard, StatCard } from "@/components/ui";

const shortcuts = [
  ["Inci → cm", "/converter", "ruler"], ["Inci → mm", "/converter", "calculator"], ["Pecahan inci", "/fractions", "grid"],
  ["Sekrup", "/categories/sekrup", "screw"], ["Baut & mur", "/categories/baut-mur", "bolt"], ["Paku & fisher", "/categories/paku-fisher", "package"],
  ["Triplek & MDF", "/categories/material-lembaran", "sheet"], ["Mata bor", "/categories/mata-bor", "drill"], ["Gerinda", "/categories/mata-gerinda", "disc"],
  ["Perkakas", "/categories/perkakas-tangan", "tool"], ["Finishing", "/categories/finishing", "paint"], ["Game ukuran", "/games/guess-cm", "game"],
  ["Kuis hardware", "/games", "quiz"], ["Kalkulator potongan", "/tools/cutting-calculator", "cut"], ["Harga per buah", "/tools/price-calculator", "price"], ["Tabel ukuran", "/fractions", "table"],
] as const;
const quickIcon = (type: string) => {
  const props = { size: 19, strokeWidth: 1.9 };
  if (type === "ruler") return <Ruler {...props} />;
  if (type === "calculator") return <Calculator {...props} />;
  if (type === "grid" || type === "table") return <Boxes {...props} />;
  if (type === "game") return <Gamepad2 {...props} />;
  if (type === "quiz") return <CircleHelp {...props} />;
  if (type === "tool" || type === "screw" || type === "bolt") return <Wrench {...props} />;
  if (type === "price") return <Zap {...props} />;
  if (type === "cut") return <Target {...props} />;
  return <PackageIcon {...props} />;
};
function PackageIcon(props: { size: number; strokeWidth: number }) { return <Boxes {...props} />; }

export function DashboardPage({ progress, favorites, toggleFavorite, historyCount, onPractice, products = PRODUCTS_DATA, categories = CATEGORIES }: {
  progress: UserProgress; favorites: string[]; toggleFavorite: (id: string) => void; historyCount: number; onPractice: (query: string, href: string) => void; products?: Product[]; categories?: Category[];
}) {
  const [quickInput, setQuickInput] = useState("3/4");
  const parsed = useMemo(() => parseMeasurement(quickInput, "in"), [quickInput]);
  const level = getLevel(progress.xp);
  const recommendation = progress.wrongQuestionIds.length > 0;
  const popular = [0.5, 0.75, 1, 1.25, 1.5, 2].map((size) => FRACTION_ROWS.find((row) => row.inches === size)).filter(Boolean);
  const favoredProducts = products.filter((product) => favorites.includes(product.slug)).slice(0, 3);
  const recentlyLearned = LEARNING_MODULES.filter((module) => !progress.completedLearning.includes(module.slug)).slice(0, 3);
  const categoryPreview = categories.slice(0, 6);
  const dailyProgress = progress.dailyDate === new Date().toLocaleDateString("sv-SE") ? Math.min(progress.dailyAnswered, 10) : 0;

  return (
    <div className="page-stack dashboard-page">
      <section className="hero-banner">
        <div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> TEMAN KERJA ANDALANMU</div><h1>Hafal ukuran.<br /><em>Kerja makin cepat.</em></h1><p>Konversi cepat, kenali barang, dan latih ingatan ukuran di satu tempat.</p><div className="hero-actions"><Link href="/converter" className="button button-primary"><Calculator size={17} /> Buka konverter <ArrowRight size={16} /></Link><Link href="/games" className="button button-hero-ghost"><Gamepad2 size={17} /> Mulai belajar</Link></div></div>
        <div className="hero-dial" aria-hidden="true"><div className="dial-ring"><div className="dial-core"><Ruler size={33} /><span>3/4″</span><small>≈ 1,9 cm</small></div></div><div className="dial-mark mark-one">1″</div><div className="dial-mark mark-two">½″</div><div className="dial-mark mark-three">¼″</div><span className="hero-spark">✦</span></div>
        <div className="hero-bottom-label"><span>KayuUkur Pro</span><span>Ukuran tepat, kerja mantap <MoveUpRight size={14} /></span></div>
      </section>

      <div className="dashboard-stats"><StatCard label="Level kamu" value={`Lv. ${level.level}`} detail={level.name} icon={<Trophy size={19} />} tone="orange" /><StatCard label="Total XP" value={progress.xp.toLocaleString("id-ID")} detail={level.next ? `${level.remaining} XP ke level berikut` : "Level tertinggi"} icon={<Zap size={19} />} tone="yellow" /><StatCard label="Jawaban benar" value={progress.correct} detail={`${getAccuracy(progress)}% akurasi dari ${progress.answered} soal`} icon={<Target size={19} />} tone="green" /><StatCard label="Streak belajar" value={`${progress.streak} hari`} detail={progress.streak ? "Terus jaga ritmenya" : "Mulai hari ini"} icon={<Flame size={19} />} tone="red" /></div>

      <section className="panel quick-converter-panel"><div className="section-heading"><div><span className="eyebrow">KALKULATOR KILAT</span><h2>Butuh ukuran sekarang?</h2><p>Ketik pecahan atau angka, hasil langsung kelihatan.</p></div><Link href="/converter" className="text-link">Konverter lengkap <ArrowRight size={15} /></Link></div><div className="quick-converter-row"><label className="quick-convert-field"><Ruler size={18} /><input value={quickInput} onChange={(e) => setQuickInput(e.target.value)} aria-label="Input ukuran cepat" placeholder="misal 1 1/4" /><span>inch</span></label><div className="quick-equals">≈</div><div className="quick-convert-result">{parsed && parsed.unit === "in" ? <><strong>{formatNumber(easyCentimetres(parsed.value), 1)}</strong><span>cm</span><small>≈ {formatNumber(Math.round(convert(parsed.value, "in", "mm")), 0)} mm</small></> : <><strong>—</strong><span>cm</span><small>Periksa input ukuran</small></>}</div><button className="button button-primary" onClick={() => onPractice(quickInput, "/converter")}><ArrowRight size={17} /> Detail</button></div><div className="quick-try-row"><span>Coba:</span>{["1/2", "3/4", "1", "1 1/4", "1 1/2", "2"].map((size) => <button key={size} onClick={() => setQuickInput(size)}>{size}″</button>)}</div></section>

      <section className="panel"><div className="section-heading"><div><span className="eyebrow">AKSES CEPAT</span><h2>Alat buat kerja hari ini</h2></div><span className="section-caption">Buka sekali sentuh</span></div><div className="shortcut-grid">{shortcuts.map(([label, href, icon]) => <Link key={label} href={href} onClick={label === "Inci → mm" ? () => { window.sessionStorage.setItem("kayu.converter.input", "3/4"); window.sessionStorage.setItem("kayu.converter.target", "mm"); } : undefined} className="shortcut-item"><span className={`shortcut-icon shortcut-${icon}`}>{quickIcon(icon)}</span><span>{label}</span><ArrowUpRight className="shortcut-arrow" size={14} /></Link>)}</div></section>

      <div className="dashboard-two-col">
        <section className="panel"><div className="section-heading"><div><span className="eyebrow">TABEL HAFALAN</span><h2>Ukuran populer</h2></div><Link href="/fractions" className="text-link">Semua pecahan <ArrowRight size={15} /></Link></div><div className="memorize-list">{popular.map((row) => row && <button key={row.inches} className="memorize-row" onClick={() => onPractice(row.label.replace("″", ""), "/converter")}><span className="memorize-inch">{row.label}</span><span className="memorize-bar"><i style={{ width: `${Math.min(row.inches / 2 * 100, 100)}%` }} /></span><b>≈ {formatNumber(row.cm, 1)} cm</b><small>≈ {row.mm} mm</small></button>)}</div></section>
        <section className="daily-card"><div className="daily-top"><span className="daily-icon"><Sparkles size={20} /></span><span className="daily-chip">HARI INI</span></div><h2>Tantangan harian</h2><p>5 konversi · 3 kenali barang · 2 kode ukuran</p><div className="daily-progress-line"><div><span>Progres hari ini</span><b>{progress.dailyCompleted ? 10 : dailyProgress}/10 soal</b></div><div className="progress-track"><span style={{ width: `${progress.dailyCompleted ? 100 : dailyProgress * 10}%` }} /></div></div><Link href="/games/daily-challenge" className="button button-dark">{progress.dailyCompleted ? "Lihat hasil hari ini" : "Mulai tantangan"} <ArrowRight size={16} /></Link><div className="daily-reward"><Zap size={14} /> Hadiah penyelesaian: +50 XP</div></section>
      </div>

      <div className="dashboard-two-col">
        <section className="panel"><div className="section-heading"><div><span className="eyebrow">KATALOG CEPAT</span><h2>Cari berdasarkan kategori</h2></div><Link href="/categories" className="text-link">Semua kategori <ArrowRight size={15} /></Link></div><div className="category-grid-mini">{categoryPreview.map((category) => <Link key={category.id} href={`/categories/${category.slug}`} className="category-mini"><span className={`mini-category-art art-${category.accent}`}><ProductArt imageKey={category.imageKey} alt={`Ilustrasi ${category.name}`} /></span><b>{category.short}</b><small>{category.name}</small><ArrowUpRight size={14} /></Link>)}</div></section>
        <section className="panel learning-nudge"><div className="section-heading"><div><span className="eyebrow">LANJUT BELAJAR</span><h2>Bekal di meja kerja</h2></div><BookOpen size={19} className="soft-icon" /></div>{recentlyLearned.map((module, index) => <Link key={module.slug} href={`/learn/${module.slug}`} className="learning-row"><span className="learning-number">0{index + 1}</span><div><b>{module.title}</b><small>{module.minutes} menit · {module.category}</small></div><ArrowRight size={15} /></Link>)}<Link href="/learn" className="text-link">Jelajahi semua materi <ArrowRight size={15} /></Link></section>
      </div>

      {recommendation && <section className="mistake-banner"><span className="mistake-icon"><Target size={21} /></span><div><b>Latihan lagi dari yang pernah keliru</b><p>{progress.wrongQuestionIds.length} soal menunggu untuk dicoba ulang. Pelan-pelan, pasti hafal.</p></div><Link className="button button-outline" href="/games/practice?focus=wrong">Ulangi soal <ArrowRight size={15} /></Link></section>}

      <div className="dashboard-two-col dashboard-bottom">
        <section className="panel game-highlight"><div><span className="eyebrow">KAYUUKUR ARCADE</span><h2>Belajar, tapi tetap seru.</h2><p>Mini game pendek buat melatih insting ukuran dan nama barang.</p><div className="game-pills"><Link href="/games/guess-cm" className="game-pill"><Ruler size={15} /> Tebak cm</Link><Link href="/games/guess-product" className="game-pill"><Boxes size={15} /> Tebak barang</Link><Link href="/games/speed-quiz" className="game-pill"><Zap size={15} /> Speed quiz</Link></div><Link href="/games" className="button button-primary">Buka Game Center <ArrowRight size={15} /></Link></div><div className="game-art"><div className="game-art-circle"><Gamepad2 size={40} /></div><span className="game-art-star star-a">✦</span><span className="game-art-star star-b">✦</span><div className="xp-float">+10 XP</div></div></section>
        <section className="panel personal-shortcuts"><div className="section-heading"><div><span className="eyebrow">PUNYAMU</span><h2>Favorit & aktivitas</h2></div><ShieldCheck size={19} className="soft-icon" /></div><Link href="/favorites" className="personal-row"><span className="personal-symbol"><Heart size={18} /></span><div><b>Produk favorit</b><small>{favorites.length} barang tersimpan</small></div><ArrowRight size={15} /></Link><Link href="/history" className="personal-row"><span className="personal-symbol"><History size={18} /></span><div><b>Riwayat konversi</b><small>{historyCount} ukuran terakhir</small></div><ArrowRight size={15} /></Link><div className="level-progress-box"><div><span>LEVEL {level.level} · {level.name}</span><b>{level.next ? `${level.remaining} XP lagi` : "Maksimum"}</b></div><div className="progress-track"><span style={{ width: `${level.progress}%` }} /></div><small>{progress.xp} / {level.next?.xp ?? level.xp} XP</small></div></section>
      </div>

      {favoredProducts.length > 0 && <section className="panel"><div className="section-heading"><div><span className="eyebrow">TERSIMPAN</span><h2>Favoritmu</h2></div><Link href="/favorites" className="text-link">Lihat semua <ArrowRight size={15} /></Link></div><div className="product-grid product-grid-small">{favoredProducts.map((product: Product) => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.slug)} onToggleFavorite={toggleFavorite} compact />)}</div></section>}

      <div className="dashboard-footer-note"><span><ShieldCheck size={15} /> Contoh katalog untuk belajar</span><span>Ukuran dan spesifikasi barang aktual selalu cocokkan dengan kemasan / datasheet.</span><Link href="/about">Tentang data KayuUkur Pro <ArrowRight size={13} /></Link></div>
    </div>
  );
}
