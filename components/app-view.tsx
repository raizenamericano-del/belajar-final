"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BookOpen, Boxes, Calculator, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Command,
  Download, Gamepad2, Heart, History, Home, Info, LayoutDashboard, LifeBuoy, LockKeyhole, Menu,
  Moon, Package, Search, Settings2, ShieldCheck, Sun, X, Zap, Ruler, Wrench, Hammer, Flame, Sparkles,
} from "lucide-react";
import { detectQuickConversion, searchProducts } from "@/lib/search";
import { convert, formatConvertedValue, formatInches, formatNumber, UNIT_LABELS, type Unit } from "@/lib/conversion";
import { CATEGORIES, PRODUCTS_DATA, type Category, type Product } from "@/lib/data";
import { fetchCloudCatalogue } from "@/lib/catalog-client";
import { supabaseConfigured } from "@/lib/supabase-browser";
import { completeDailyChallenge, getLevel, markLearningComplete, recordAnswer, type UserProgress } from "@/lib/progress";
import { addFavorite, pushHistory, pushSearch, readList, readProgress, removeFavorite, type ConversionHistoryEntry } from "@/lib/storage";
import { AdminPage } from "@/components/admin";
import { CatalogPage, CategoriesPage, CategoryDetailPage, FavoritesPage, HistoryPage, ProductDetailPage } from "@/components/catalog";
import { ConverterPage } from "@/components/converter";
import { DashboardPage } from "@/components/dashboard";
import { GameCenterPage, type GameCallbacks } from "@/components/games";
import { LearningDetailPage, LearningHomePage, ProfilePage } from "@/components/learning";
import { FractionsPage, ToolsPage } from "@/components/tools";

const NAV_GROUPS = [
  { title: "WORKSPACE", items: [
    { label: "Beranda", href: "/", icon: LayoutDashboard },
    { label: "Konverter", href: "/converter", icon: Calculator, badge: "CEPAT" },
    { label: "Tabel pecahan", href: "/fractions", icon: Ruler },
  ] },
  { title: "REFERENSI BARANG", items: [
    { label: "Katalog produk", href: "/catalog", icon: Boxes },
    { label: "Kategori", href: "/categories", icon: Package },
  ] },
  { title: "BELAJAR & MAIN", items: [
    { label: "Game center", href: "/games", icon: Gamepad2 },
    { label: "Pusat belajar", href: "/learn", icon: BookOpen },
    { label: "Kalkulator alat", href: "/tools", icon: Settings2 },
  ] },
];
const UNIT_TEXT: Record<Unit, string> = { in: "inch", ft: "ft", m: "meter", cm: "cm", mm: "mm" };

export default function AppView() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [searchText, setSearchText] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearch, setRecentSearch] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(PRODUCTS_DATA);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(CATEGORIES);
  const [history, setHistory] = useState<ConversionHistoryEntry[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    xp: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0, lastStudyDate: "", wrongQuestionIds: [], completedLearning: [],
    earnedBadges: [], categoryStats: {}, dailyDate: "", dailyAnswered: 0, dailyCompleted: false, bestSpeedScore: 0,
  });
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [converterSeed, setConverterSeed] = useState("");
  const [converterTargetSeed, setConverterTargetSeed] = useState<Unit>("cm");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);

  useEffect(() => {
    try { setTheme((window.localStorage.getItem("kayu.theme") as "light" | "dark") || "light"); } catch { /* Storage can be disabled by browser policy. */ }
    setFavorites(readList<string>("favorites")); setHistory(readList<ConversionHistoryEntry>("conversionHistory")); setProgress(readProgress()); setRecentSearch(readList<string>("searchHistory"));
    let catalogueDisposed = false;
    const refreshCatalogue = () => { void fetchCloudCatalogue().then((result) => { if (result && !catalogueDisposed) { setCatalogCategories(result.categories); setCatalogProducts(result.products); } }).catch(() => undefined); };
    const onCatalogueUpdated = () => refreshCatalogue();
    refreshCatalogue(); window.addEventListener("kayu:catalog-updated", onCatalogueUpdated);
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    const onInstalled = () => { setPwaInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onInstall); window.addEventListener("appinstalled", onInstalled);
    const onHotkey = (event: KeyboardEvent) => { if (event.key === "/" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName ?? "")) { event.preventDefault(); searchRef.current?.focus(); } };
    window.addEventListener("keydown", onHotkey);
    return () => { catalogueDisposed = true; window.removeEventListener("kayu:catalog-updated", onCatalogueUpdated); window.removeEventListener("beforeinstallprompt", onInstall); window.removeEventListener("appinstalled", onInstalled); window.removeEventListener("keydown", onHotkey); };
  }, []);

  useEffect(() => { document.documentElement.dataset.theme = theme; try { window.localStorage.setItem("kayu.theme", theme); } catch { /* Storage can be disabled by browser policy. */ } }, [theme]);
  useEffect(() => { setMobileMenu(false); setSearchOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }, [pathname]);
  useEffect(() => {
    if (pathname === "/converter") {
      const pending = window.sessionStorage.getItem("kayu.converter.input");
      const pendingTarget = window.sessionStorage.getItem("kayu.converter.target") as Unit | null;
      if (pending) { setConverterSeed(pending); window.sessionStorage.removeItem("kayu.converter.input"); }
      else setConverterSeed("");
      if (pendingTarget && ["in", "ft", "m", "cm", "mm"].includes(pendingTarget)) { setConverterTargetSeed(pendingTarget); window.sessionStorage.removeItem("kayu.converter.target"); }
      else setConverterTargetSeed("cm");
    }
  }, [pathname]);

  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); }, []);
  const changeProgress = useCallback((fn: (old: UserProgress) => UserProgress) => {
    setProgress((old) => { const next = fn(old); try { window.localStorage.setItem("kayu.progress", JSON.stringify(next)); } catch { /* Keep the in-memory session if storage is unavailable. */ } return next; });
  }, []);
  const onAnswer = useCallback((correct: boolean, questionId: string, category: string, xp?: number) => {
    changeProgress((old) => recordAnswer(old, { correct, questionId, category, xp }));
  }, [changeProgress]);
  const onDailyComplete = useCallback(() => { changeProgress((old) => old.dailyCompleted ? old : completeDailyChallenge(old)); notify("Tantangan harian selesai! Bonus +50 XP."); }, [changeProgress, notify]);
  const onSpeedScore = useCallback((score: number) => {
    changeProgress((old) => ({ ...old, bestSpeedScore: Math.max(old.bestSpeedScore, score), xp: old.xp + 20 }));
    notify("Speed quiz selesai · bonus ronde +20 XP!");
  }, [changeProgress, notify]);
  const onCompleteLearning = useCallback((slug: string) => {
    changeProgress((old) => old.completedLearning.includes(slug) ? old : markLearningComplete(old, slug));
    notify("Materi ditandai selesai · +15 XP.");
  }, [changeProgress, notify]);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((old) => { const next = old.includes(id) ? removeFavorite(id) : addFavorite(id); notify(next.includes(id) ? "Barang ditambahkan ke favorit." : "Barang dihapus dari favorit."); return next; });
  }, [notify]);
  const addConversionHistory = useCallback((entry: Omit<ConversionHistoryEntry, "id" | "timestamp">) => {
    setHistory(pushHistory(entry));
  }, []);
  const gameCallbacks: GameCallbacks = useMemo(() => ({ onAnswer, onDailyComplete, onSpeedScore, notify }), [onAnswer, onDailyComplete, onSpeedScore, notify]);

  const quickConversion = useMemo(() => detectQuickConversion(searchText), [searchText]);
  const quickConversionDisplay = useMemo(() => quickConversion ? formatConvertedValue(quickConversion.value, quickConversion.from, quickConversion.to, quickConversion.exactValue) : null, [quickConversion]);
  const searchMatches = useMemo(() => quickConversion ? [] : searchProducts(searchText, catalogProducts).slice(0, 5), [searchText, quickConversion, catalogProducts]);
  const progressLevel = getLevel(progress.xp);

  function doSearch(query = searchText) {
    const clean = query.trim(); if (!clean) { searchRef.current?.focus(); return; }
    const recents = pushSearch(clean); setRecentSearch(recents); setSearchText(clean); setSearchOpen(false);
    const conversion = detectQuickConversion(clean);
    if (conversion) {
      if (pathname === "/converter") { setConverterSeed(conversion.source); setConverterTargetSeed(conversion.to); }
      else { window.sessionStorage.setItem("kayu.converter.input", conversion.source); window.sessionStorage.setItem("kayu.converter.target", conversion.to); router.push("/converter"); }
    } else { setCatalogQuery(clean); router.push("/catalog"); }
  }
  function useRecent(query: string) { setSearchText(query); doSearch(query); }
  function openSearchResult(slug: string) { const recent = pushSearch(searchText); setRecentSearch(recent); setSearchOpen(false); router.push(`/catalog/${slug}`); }
  function practiceQuery(query: string, href: string) { window.sessionStorage.setItem("kayu.converter.input", query); window.sessionStorage.setItem("kayu.converter.target", "cm"); router.push(href); }
  async function installPwa() { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }

  const categoryRoute = pathname.match(/^\/categories\/([^/]+)/);
  const productRoute = pathname.match(/^\/catalog\/([^/]+)/);
  const learnRoute = pathname.match(/^\/learn\/([^/]+)/);
  const toolsRoute = pathname.match(/^\/tools(?:\/([^/]+))?/);
  let content: React.ReactNode;
  if (pathname === "/" || pathname === "") content = <DashboardPage progress={progress} favorites={favorites} toggleFavorite={toggleFavorite} historyCount={history.length} onPractice={practiceQuery} products={catalogProducts} categories={catalogCategories} />;
  else if (pathname === "/converter") content = <ConverterPage onHistory={addConversionHistory} notify={notify} initialInput={converterSeed} initialTarget={converterTargetSeed} />;
  else if (pathname === "/fractions") content = <FractionsPage notify={notify} onAnswer={onAnswer} />;
  else if (pathname === "/catalog") content = <CatalogPage favorites={favorites} toggleFavorite={toggleFavorite} initialQuery={catalogQuery} notify={notify} productsData={catalogProducts} categoriesData={catalogCategories} />;
  else if (productRoute) content = <ProductDetailPage key={productRoute[1]} slug={decodeURIComponent(productRoute[1])} favorites={favorites} toggleFavorite={toggleFavorite} notify={notify} productsData={catalogProducts} categoriesData={catalogCategories} />;
  else if (pathname === "/categories") content = <CategoriesPage categoriesData={catalogCategories} productsData={catalogProducts} />;
  else if (categoryRoute) content = <CategoryDetailPage key={categoryRoute[1]} slug={decodeURIComponent(categoryRoute[1])} favorites={favorites} toggleFavorite={toggleFavorite} productsData={catalogProducts} categoriesData={catalogCategories} />;
  else if (pathname === "/games" || pathname.startsWith("/games/")) content = <GameCenterPage key={pathname} path={pathname} progress={progress} callbacks={gameCallbacks} />;
  else if (pathname === "/learn") content = <LearningHomePage progress={progress} />;
  else if (learnRoute) content = <LearningDetailPage key={learnRoute[1]} slug={decodeURIComponent(learnRoute[1])} progress={progress} onComplete={onCompleteLearning} onAnswer={onAnswer} />;
  else if (toolsRoute) content = <ToolsPage slug={toolsRoute[1] ?? ""} notify={notify} />;
  else if (pathname === "/favorites") content = <FavoritesPage favorites={favorites} toggleFavorite={toggleFavorite} notify={notify} productsData={catalogProducts} />;
  else if (pathname === "/history") content = <HistoryPage notify={notify} />;
  else if (pathname === "/profile") content = <ProfilePage progress={progress} notify={notify} />;
  else if (pathname === "/admin") content = <AdminPage notify={notify} />;
  else if (pathname === "/about") content = <AboutPage />;
  else content = <NotFound />;

  return <div className="app-shell" data-theme={theme}>
    <a href="#main-content" className="skip-link">Lewati ke konten</a>
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Link href="/" className="brand-mark"><Image src="/images/logo.svg" width={42} height={42} alt="Logo KayuUkur Pro" priority /></Link><Link href="/" className="brand-copy"><b>KayuUkur<span>Pro</span></b><small>HARDWARE FIELD GUIDE</small></Link><button className="sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Tutup menu"><X size={18} /></button></div>
      <div className="workspace-selector"><span className="workspace-avatar">K</span><div><b>Meja kerja</b><small>{supabaseConfigured ? "Katalog cloud · progres lokal" : "Mode demo · offline siap"}</small></div><ChevronDown size={15} /></div>
      <nav className="side-navigation" aria-label="Navigasi utama">{NAV_GROUPS.map((group) => <div className="nav-group" key={group.title}><span className="nav-group-label">{group.title}</span>{group.items.map(({ label, href, icon: Icon, badge }) => <Link key={href} href={href} className={`nav-item ${pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{badge && <small>{badge}</small>}{pathname === href && <i />}</Link>)}</div>)}<div className="nav-group"><span className="nav-group-label">RUANG PRIBADI</span><Link href="/favorites" className={`nav-item ${pathname === "/favorites" ? "active" : ""}`}><Heart size={18} /><span>Favorit</span>{favorites.length > 0 && <small className="nav-count">{favorites.length}</small>}</Link><Link href="/history" className={`nav-item ${pathname === "/history" ? "active" : ""}`}><History size={18} /><span>Riwayat</span></Link><Link href="/profile" className={`nav-item ${pathname === "/profile" ? "active" : ""}`}><Flame size={18} /><span>Progres belajar</span></Link></div></nav>
      <div className="sidebar-level-card"><div className="level-card-head"><span className="level-medal"><Zap size={15} /></span><span>LEVEL {progressLevel.level}</span><b>{progress.xp} XP</b></div><strong>{progressLevel.name}</strong><div className="progress-track"><span style={{ width: `${progressLevel.progress}%` }} /></div><div className="level-card-foot"><small>{progressLevel.next ? `${progressLevel.remaining} XP ke level berikut` : "Level tertinggi"}</small><Link href="/games"><ArrowRight size={14} /></Link></div></div>
      <div className="sidebar-bottom"><Link href="/admin" className={`side-mini-link ${pathname === "/admin" ? "active" : ""}`}><LockKeyhole size={15} /> Admin</Link><Link href="/about" className="side-mini-link"><Info size={15} /> Tentang aplikasi</Link><div className="sidebar-version"><span className="status-dot" /> Versi 1.0 · {supabaseConfigured ? "Supabase aktif" : "Demo lokal"}</div></div>
    </aside>

    <div className="app-main"><header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Buka menu"><Menu size={21} /></button><div className="topbar-breadcrumb"><span>KayuUkur Pro</span><ChevronRight size={14} /><b>{breadcrumb(pathname)}</b></div><div className="global-search-wrap"><div className={`global-search ${searchOpen ? "search-focused" : ""}`}><Search size={18} /><input ref={searchRef} value={searchText} onFocus={() => setSearchOpen(true)} onChange={(e) => { setSearchText(e.target.value); setSearchOpen(true); }} onKeyDown={(e) => { if (e.key === "Enter") doSearch(); if (e.key === "Escape") setSearchOpen(false); }} placeholder="Cari ukuran, barang, atau konversi…" aria-label="Pencarian global" /><kbd><Command size={11} /> /</kbd>{searchText && <button onClick={() => { setSearchText(""); setSearchOpen(true); }} aria-label="Hapus pencarian"><X size={15} /></button>}</div>{searchOpen && <><button className="search-backdrop" aria-label="Tutup saran pencarian" onClick={() => setSearchOpen(false)} /><div className="search-dropdown">{searchText.trim() ? quickConversion ? <><span className="search-dropdown-label">KONVERSI CEPAT</span><button className="quick-search-result" onClick={() => doSearch()}><span className="quick-search-icon"><Calculator size={18} /></span><span><b>{quickConversion.source} → {quickConversionDisplay?.symbol} {quickConversionDisplay?.text} {UNIT_LABELS[quickConversion.to]}</b><small>Ketuk untuk buka kalkulator · 1 inch = 25,4 mm</small></span><ArrowRight size={15} /></button></> : <><span className="search-dropdown-label">BARANG YANG MUNGKIN COCOK</span>{searchMatches.length ? searchMatches.map((product) => <button key={product.slug} className="search-product-result" onClick={() => openSearchResult(product.slug)}><span className="search-product-icon"><Package size={17} /></span><span><b>{product.name}</b><small>{product.subcategory} · {product.code}</small></span><ArrowRight size={14} /></button>) : <div className="search-no-results">Belum ada hasil. Tekan Enter untuk cari di seluruh katalog.</div>}<button className="search-all-results" onClick={() => doSearch()}>Cari “{searchText}” di katalog <ArrowRight size={14} /></button></> : <><span className="search-dropdown-label">PENCARIAN TERAKHIR</span>{recentSearch.length ? recentSearch.slice(0, 5).map((item) => <button key={item} className="recent-search-item" onClick={() => useRecent(item)}><Clock3 size={15} /> {item}<ArrowRight size={13} /></button>) : <div className="search-hint"><span className="search-hint-icon"><Sparkles size={17} /></span><div><b>Cari seperti ngobrol</b><small>“3/4 inch ke cm”, “sekrup FFO 1 inch”, “mata bor 6 mm”</small></div></div>}<div className="search-shortcuts"><span>Contoh</span>{["1 1/4 inch", "baut M8", "triplek 12 mm"].map((item) => <button key={item} onClick={() => { setSearchText(item); setSearchOpen(true); }}>{item}</button>)}</div></>}</div></>}</div><div className="topbar-actions"><button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title={theme === "light" ? "Aktifkan mode gelap" : "Aktifkan mode terang"} aria-label={theme === "light" ? "Mode gelap" : "Mode terang"}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>{installPrompt && !pwaInstalled && <button className="install-button" onClick={() => void installPwa()}><Download size={16} /><span>Instal</span></button>}<Link href="/profile" className="topbar-profile" aria-label="Lihat profil"><span className="profile-initial">K</span><span className="topbar-level">Lv {progressLevel.level}</span></Link></div></header>
      <main id="main-content" className="page-content">{content}<footer className="app-footer"><span>© {new Date().getFullYear()} KayuUkur Pro</span><span>Ukuran eksak · Catatan jelas · Kerja lebih cepat</span><Link href="/about">Tentang <ArrowRight size={13} /></Link></footer></main></div>
    <nav className="mobile-bottom-nav" aria-label="Navigasi mobile"><Link href="/" className={pathname === "/" ? "active" : ""}><Home size={19} /><span>Home</span></Link><Link href="/converter" className={pathname === "/converter" ? "active" : ""}><Calculator size={19} /><span>Konversi</span></Link><Link href="/games" className={pathname.startsWith("/games") ? "active" : ""}><Gamepad2 size={19} /><span>Game</span></Link><Link href="/catalog" className={pathname.startsWith("/catalog") || pathname.startsWith("/categories") ? "active" : ""}><Boxes size={19} /><span>Katalog</span></Link><Link href="/learn" className={pathname.startsWith("/learn") ? "active" : ""}><BookOpen size={19} /><span>Belajar</span></Link></nav>
    {toast && <div className="toast-message" role="status"><span><CheckCircleIcon /></span>{toast}</div>}
  </div>;
}

function breadcrumb(path: string) {
  if (path === "/") return "Beranda";
  if (path.startsWith("/converter")) return "Kalkulator konversi";
  if (path.startsWith("/fractions")) return "Tabel pecahan";
  if (path.startsWith("/catalog/")) return "Detail barang";
  if (path === "/catalog") return "Katalog produk";
  if (path.startsWith("/categories")) return "Kategori";
  if (path.startsWith("/games")) return "Game center";
  if (path.startsWith("/learn/")) return "Materi belajar";
  if (path === "/learn") return "Pusat belajar";
  if (path.startsWith("/tools")) return "Kalkulator alat";
  if (path === "/favorites") return "Favorit";
  if (path === "/history") return "Riwayat";
  if (path === "/profile") return "Profil belajar";
  if (path === "/admin") return "Panel admin";
  if (path === "/about") return "Tentang";
  return "Halaman";
}

function CheckCircleIcon() { return <Check size={17} />; }

function AboutPage() {
  return <div className="page-stack"><section className="about-hero"><div className="about-brand-mark"><Image src="/images/logo.svg" width={76} height={76} alt="Logo KayuUkur Pro" /></div><div><span className="eyebrow">TENTANG PRODUK</span><h1>KayuUkur <em>Pro</em></h1><p>Hafal Ukuran, Kenali Barang, Kerja Makin Cepat.</p><span className="about-version"><span className="status-dot" /> Versi 1.0 · Mode demo lokal</span></div></section><div className="about-content-grid"><section className="panel about-mission"><span className="eyebrow">UNTUK MEJA KERJA</span><h2>Bukan katalog merek. Panduan yang transparan.</h2><p>KayuUkur Pro membantu pekerja toko perkayuan dan hardware menghitung ukuran, mengenali istilah barang, dan belajar melalui latihan singkat.</p><p>Ilustrasi pada aplikasi dibuat sebagai visual orisinal; bukan foto produk asli. Contoh entri katalog adalah dataset demo—bukan klaim stok, harga, atau spesifikasi produk dari merek tertentu.</p></section><section className="panel about-facts"><span className="eyebrow">PRINSIP DATA</span><div><b>Konversi eksak</b><span>1 inch = 25,4 mm = 2,54 cm; pembulatan hanya untuk tampilan.</span></div><div><b>Spesifikasi jelas</b><span>Kode #6/#8 tidak otomatis diubah ke mm. M8 adalah diameter nominal ulir, bukan panjang.</span></div><div><b>Harga & stok</b><span>Tidak diisi otomatis. Harga dan stok ditentukan masing-masing toko.</span></div><div><b>Privasi progres</b><span>Mode demo menyimpan XP, favorit, dan riwayat secara lokal di perangkat.</span></div></section></div><section className="panel about-capabilities"><div className="section-heading"><div><span className="eyebrow">PETA FITUR</span><h2>Temukan yang kamu butuhkan</h2></div></div><div className="about-link-grid"><Link href="/converter"><Calculator size={18} /><b>Konverter</b><span>Input desimal, pecahan, dan unit</span></Link><Link href="/fractions"><Ruler size={18} /><b>Hafalan inci</b><span>Tabel pecahan dan kuis singkat</span></Link><Link href="/catalog"><Boxes size={18} /><b>Ensiklopedia</b><span>Sekrup, baut, panel, perkakas, K3</span></Link><Link href="/games"><Gamepad2 size={18} /><b>Arcade</b><span>XP, level, dan latihan interaktif</span></Link><Link href="/learn"><BookOpen size={18} /><b>Pusat belajar</b><span>18 materi bertahap</span></Link><Link href="/tools"><Settings2 size={18} /><b>Kalkulator toko</b><span>Panel, potongan, harga, diameter</span></Link></div></section><section className="panel deployment-box"><div><span className="eyebrow">DEPLOY & KONFIGURASI</span><h2>Proyek siap dikembangkan</h2><p>Dokumentasi setup Next.js, Vercel, Supabase, PWA, dataset, dan pengujian ada pada README.md.</p></div><div className="deploy-badges"><span>Next.js App Router</span><span>Supabase PostgreSQL</span><span>Offline/PWA</span><span>Automated tests</span></div></section></div>;
}

function NotFound() { return <div className="not-found"><span><Search size={26} /></span><span className="eyebrow">404 · TIDAK DITEMUKAN</span><h1>Ukuran halaman belum pas.</h1><p>Halaman yang dicari tidak tersedia. Pilih jalan pintas di bawah.</p><div><Link href="/" className="button button-primary">Kembali ke beranda</Link><Link href="/catalog" className="button button-outline">Buka katalog</Link></div></div>; }

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };
