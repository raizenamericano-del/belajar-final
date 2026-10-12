"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownToLine, ArrowRight, ArrowUpFromLine, BadgeCheck, Check, Database, FileSpreadsheet, LockKeyhole, LogIn, LogOut, PackagePlus, Plus, Save, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { supabaseConfigured, getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { CATEGORIES, PRODUCTS_DATA, type Product } from "@/lib/data";
import { validateProductInput, validateQuizInput } from "@/lib/validation";
import { PageTitle, InfoNote } from "@/components/ui";

const defaultForm = { name: "", slug: "", category_id: "sekrup", subcategory: "", code: "", image_key: "screw", aliases: "", description: "", uses: "", note: "", verification: "example", length_mm: "", diameter_code: "", thickness_mm: "", specifications_json: "{}" };

type AdminTab = "products" | "categories" | "learning" | "quizzes";

export function AdminPage({ notify }: { notify: (text: string) => void }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState(""); const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState(""); const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [learning, setLearning] = useState<Record<string, unknown>[]>([]);
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([]);
  const [tab, setTab] = useState<AdminTab>("products");
  const [form, setForm] = useState(defaultForm); const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ id: "", slug: "", name: "", description: "", image_key: "hand-tools" });
  const [moduleForm, setModuleForm] = useState({ slug: "", title: "", category: "Dasar", minutes: "5", image_key: "measuring-tools", intro: "", body: "", takeaway: "", question: "", options: "", answer: "", explanation: "" });
  const [questionForm, setQuestionForm] = useState({ category: "konversi", prompt: "", options: "", answer: "", explanation: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setUserEmail(user?.email ?? ""); setIsAdmin(user?.app_metadata?.role === "admin" || (Array.isArray(user?.app_metadata?.roles) && user.app_metadata.roles.includes("admin")));
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserEmail(user?.email ?? ""); setIsAdmin(user?.app_metadata?.role === "admin" || (Array.isArray(user?.app_metadata?.roles) && user.app_metadata.roles.includes("admin")));
    });
    return () => listener.subscription.unsubscribe();
  }, [client]);

  async function loadData() {
    if (!client || !isAdmin) return;
    setLoading(true);
    try {
      const [productResult, categoryResult, moduleResult, questionResult] = await Promise.all([
        client.from("products").select("*").order("name").limit(500),
        client.from("categories").select("*").order("name"),
        client.from("learning_modules").select("*").order("title"),
        client.from("quiz_questions").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      if (productResult.error) notify(`Produk: ${productResult.error.message}`); else { setProducts(productResult.data ?? []); window.dispatchEvent(new Event("kayu:catalog-updated")); }
      if (!categoryResult.error) setCategories(categoryResult.data ?? []);
      if (!moduleResult.error) setLearning(moduleResult.data ?? []);
      if (!questionResult.error) setQuestions(questionResult.data ?? []);
    } catch (error) { notify(`Gagal memuat data admin: ${error instanceof Error ? error.message : "koneksi Supabase terputus"}`); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (isAdmin) void loadData(); }, [isAdmin]);

  async function signIn(event: FormEvent) {
    event.preventDefault(); if (!client) return;
    setLoading(true); setLoginError("");
    try {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setLoginError(error.message);
      else { setPassword(""); notify("Masuk berhasil. Hak akses admin dicek oleh server database."); }
    } catch (error) { setLoginError(error instanceof Error ? error.message : "Tidak dapat terhubung ke Supabase."); }
    finally { setLoading(false); }
  }
  async function signOut() { await client?.auth.signOut(); setIsAdmin(false); notify("Sesi admin ditutup."); }

  function handleProductChange(field: keyof typeof defaultForm, value: string) {
    setForm((old) => ({ ...old, [field]: value, ...(field === "name" && !editingId ? { slug: value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") } : {}) }));
  }
  async function uploadProductImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      notify("Gambar harus JPG, PNG, atau WebP dan maksimal 5 MB."); event.target.value = ""; return;
    }
    if (!client || !isAdmin) { notify("Upload hanya tersedia untuk admin yang sudah masuk."); event.target.value = ""; return; }
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const safeSlug = (form.slug || "produk").replace(/[^a-z0-9-]/gi, "-");
    const path = `catalog/${safeSlug}/${Date.now()}.${ext}`;
    setLoading(true);
    try {
      const { error } = await client.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (error) notify(`Upload gagal: ${error.message}`);
      else {
        const { data } = client.storage.from("product-images").getPublicUrl(path);
        setForm((old) => ({ ...old, image_key: data.publicUrl }));
        notify("Gambar diunggah. Simpan produk untuk menerapkan URL.");
      }
    } catch (error) { notify(`Upload gagal: ${error instanceof Error ? error.message : "koneksi terputus"}`); }
    finally { setLoading(false); event.target.value = ""; }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault(); if (!client || !isAdmin) return;
    const validation = validateProductInput({ name: form.name, slug: form.slug, category_id: form.category_id, code: form.code, verification: form.verification, length_mm: form.length_mm, thickness_mm: form.thickness_mm });
    if (!validation.valid) { notify(validation.reason); return; }
    const aliases = Array.from(new Set([...form.name.toLowerCase().split(/\s+/).filter(Boolean), ...form.aliases.split(/[;,|]/).map((item) => item.trim().toLowerCase()).filter(Boolean)]));
    let specifications: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(form.specifications_json || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Spesifikasi harus berupa objek JSON.");
      specifications = parsed as Record<string, unknown>;
    } catch { notify("Spesifikasi harus berupa JSON object yang valid."); return; }
    if (form.length_mm.trim()) specifications.length_mm = Number(form.length_mm);
    if (form.thickness_mm.trim()) specifications.thickness_mm = Number(form.thickness_mm);
    if (form.diameter_code.trim()) specifications.diameter_code = form.diameter_code.trim();
    const payload = { name: form.name.trim(), slug: form.slug.trim(), category_id: form.category_id, subcategory: form.subcategory.trim() || form.category_id, code: form.code.trim(), image_key: form.image_key.trim() || "hand-tools", description: form.description.trim(), uses: form.uses.trim(), note: form.note.trim(), verification: form.verification, aliases, specifications, is_published: true };
    setLoading(true);
    try {
      const result = editingId ? await client.from("products").update(payload).eq("id", editingId) : await client.from("products").insert(payload);
      if (result.error) notify(`Gagal menyimpan: ${result.error.message}`); else { notify(editingId ? "Produk diperbarui." : "Produk ditambahkan."); setForm(defaultForm); setEditingId(null); await loadData(); }
    } catch (error) { notify(`Gagal menyimpan: ${error instanceof Error ? error.message : "koneksi Supabase terputus"}`); }
    finally { setLoading(false); }
  }
  function editProduct(row: Record<string, unknown>) {
    const specs = (row.specifications ?? {}) as Record<string, unknown>;
    setEditingId(String(row.id));
    setForm({ name: String(row.name ?? ""), slug: String(row.slug ?? ""), category_id: String(row.category_id ?? "sekrup"), subcategory: String(row.subcategory ?? ""), code: String(row.code ?? ""), image_key: String(row.image_key ?? "hand-tools"), aliases: Array.isArray(row.aliases) ? row.aliases.map(String).join(", ") : "", specifications_json: JSON.stringify(specs, null, 2), description: String(row.description ?? ""), uses: String(row.uses ?? ""), note: String(row.note ?? ""), verification: String(row.verification ?? "example"), length_mm: String(specs.length_mm ?? ""), diameter_code: String(specs.diameter_code ?? ""), thickness_mm: String(specs.thickness_mm ?? "") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function deleteProduct(row: Record<string, unknown>) {
    if (!client || !isAdmin || !window.confirm(`Hapus produk “${String(row.name)}”? Tindakan ini tidak dapat dibatalkan.`)) return;
    const { error } = await client.from("products").delete().eq("id", row.id);
    if (error) notify(`Gagal menghapus: ${error.message}`); else { notify("Produk dihapus."); await loadData(); }
  }
  async function addCategory(event: FormEvent) {
    event.preventDefault(); if (!client || !isAdmin) return;
    const id = categoryForm.id.trim(); const slug = categoryForm.slug.trim() || id;
    if (!id || !categoryForm.name.trim()) { notify("ID dan nama kategori wajib diisi."); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { notify("ID dan slug kategori hanya boleh berisi huruf kecil, angka, serta tanda hubung tunggal."); return; }
    const { error } = await client.from("categories").upsert({ ...categoryForm, id, slug, is_published: true });
    if (error) notify(`Kategori belum tersimpan: ${error.message}`); else { notify("Kategori disimpan."); setCategoryForm({ id: "", slug: "", name: "", description: "", image_key: "hand-tools" }); await loadData(); }
  }
  async function deleteCategory(row: Record<string, unknown>) {
    if (!client || !window.confirm(`Hapus kategori ${String(row.name)}? Produk terkait dapat terblokir oleh relasi database.`)) return;
    const { error } = await client.from("categories").delete().eq("id", row.id); if (error) notify(error.message); else await loadData();
  }
  async function addModule(event: FormEvent) {
    event.preventDefault(); if (!client || !isAdmin) return;
    const payload = { slug: moduleForm.slug.trim(), title: moduleForm.title.trim(), category: moduleForm.category.trim(), minutes: Number(moduleForm.minutes) || 5, image_key: moduleForm.image_key.trim(), intro: moduleForm.intro.trim(), body: moduleForm.body.split("\n").map((s) => s.trim()).filter(Boolean), takeaway: moduleForm.takeaway.trim(), question: { prompt: moduleForm.question.trim(), options: moduleForm.options.split("|").map((s) => s.trim()).filter(Boolean), answer: moduleForm.answer.trim(), explanation: moduleForm.explanation.trim() }, is_published: true };
    const { error } = await client.from("learning_modules").upsert(payload);
    if (error) notify(error.message); else { notify("Materi belajar disimpan."); await loadData(); }
  }
  async function deleteModule(row: Record<string, unknown>) { if (!client || !window.confirm(`Hapus materi ${String(row.title)}?`)) return; const { error } = await client.from("learning_modules").delete().eq("slug", row.slug); if (error) notify(error.message); else await loadData(); }
  async function addQuestion(event: FormEvent) {
    event.preventDefault(); if (!client || !isAdmin) return;
    const options = questionForm.options.split("|").map((s) => s.trim()).filter(Boolean);
    const validation = validateQuizInput({ prompt: questionForm.prompt, options, answer: questionForm.answer });
    if (!validation.valid) { notify(validation.reason); return; }
    const { error } = await client.from("quiz_questions").insert({ category: questionForm.category, prompt: questionForm.prompt.trim(), options, answer: questionForm.answer.trim(), explanation: questionForm.explanation.trim(), is_published: true });
    if (error) notify(error.message); else { notify("Soal kuis ditambahkan."); setQuestionForm({ category: "konversi", prompt: "", options: "", answer: "", explanation: "" }); await loadData(); }
  }
  async function deleteQuestion(row: Record<string, unknown>) { if (!client || !window.confirm("Hapus soal kuis ini?")) return; const { error } = await client.from("quiz_questions").delete().eq("id", row.id); if (error) notify(error.message); else await loadData(); }

  function exportProducts() {
    const rows = products.length ? products : PRODUCTS_DATA.map(toCsvProduct);
    const headers = ["name", "slug", "category_id", "subcategory", "code", "image_key", "description", "uses", "note", "verification", "aliases", "specifications"];
    const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(Array.isArray(row[header]) ? (row[header] as string[]).join(" | ") : typeof row[header] === "object" && row[header] !== null ? JSON.stringify(row[header]) : String(row[header] ?? ""))).join(","))].join("\n");
    downloadFile("kayuukur-products.csv", csv, "text/csv;charset=utf-8");
    notify("CSV katalog diunduh.");
  }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !client || !isAdmin) return;
    if (!file.name.toLowerCase().endsWith(".csv") || file.size > 2_000_000) { notify("Pilih CSV maksimal 2 MB."); event.target.value = ""; return; }
    const text = await file.text(); const parsed = parseCsv(text);
    if (parsed.length === 0) { notify("CSV kosong atau header tidak dikenali."); event.target.value = ""; return; }
    const allowed = ["name", "slug", "category_id", "subcategory", "code", "image_key", "description", "uses", "note", "verification", "aliases", "specifications"];
    const records = parsed.map((row) => Object.fromEntries(allowed.map((key) => [key, row[key] ?? ""])) as Record<string, string>);
    const invalidRow = records.find((row) => !validateProductInput(row).valid);
    if (invalidRow) { notify(`CSV tidak valid pada produk “${invalidRow.name || "(tanpa nama)"}”. Cek name, slug, kategori, kode, dan status verifikasi.`); event.target.value = ""; return; }
    const invalidSpecs = records.find((row) => parseSpecifications(row.specifications) === null);
    if (invalidSpecs) { notify(`Kolom specifications harus JSON object valid untuk “${invalidSpecs.name}”.`); event.target.value = ""; return; }
    setLoading(true); const { error } = await client.from("products").upsert(records.map((r) => ({ ...r, aliases: String(r.aliases ?? "").split(/[;|]/).map((alias) => alias.trim()).filter(Boolean), specifications: parseSpecifications(r.specifications), is_published: true })), { onConflict: "slug" });
    if (error) notify(`Impor gagal: ${error.message}`); else { notify(`${records.length} baris CSV berhasil diimpor.`); await loadData(); }
    setLoading(false); event.target.value = "";
  }
  const filteredProducts = products.filter((row) => String(row.name ?? "").toLowerCase().includes(search.toLowerCase()) || String(row.code ?? "").toLowerCase().includes(search.toLowerCase()));

  if (!supabaseConfigured || !client) return <ReadOnlyAdmin notify={notify} />;
  if (!userEmail) return <div className="page-stack"><PageTitle eyebrow="AREA ADMIN" title="Kelola KayuUkur Pro" subtitle="Panel admin memakai Supabase Auth. Tidak ada service role key di browser." /><div className="admin-login-card"><div className="admin-lock"><LockKeyhole size={24} /></div><span className="eyebrow">MASUK DENGAN AKUN ADMIN</span><h2>Konten hanya untuk pengelola</h2><p>Akun harus memiliki klaim <code>app_metadata.role = admin</code>. Akun biasa tidak dapat menulis karena Row Level Security.</p><form onSubmit={signIn} className="admin-login-form"><label>Email admin<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@tokomu.id" /></label><label>Kata sandi<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></label>{loginError && <div className="admin-error"><AlertTriangle size={15} /> {loginError}</div>}<button className="button button-primary" disabled={loading}><LogIn size={16} /> {loading ? "Memeriksa…" : "Masuk aman"}</button></form><div className="admin-security-note"><ShieldCheck size={16} /> Autentikasi dan izin tulis diverifikasi oleh Supabase. Jangan pernah menaruh service_role key di NEXT_PUBLIC_*.</div></div><AdminSetupHint /></div>;
  if (!isAdmin) return <div className="page-stack"><PageTitle eyebrow="AKSES TERBATAS" title="Akun ini bukan admin" subtitle="Sesi masuk valid, tetapi klaim admin tidak ditemukan. Tidak ada perubahan data yang diizinkan." /><div className="admin-login-card"><span className="admin-lock"><LockKeyhole size={24} /></span><p>Masuk sebagai <b>{userEmail}</b>. Minta pemilik proyek memberi klaim app_metadata.role = admin melalui proses tepercaya server-side.</p><button className="button button-outline" onClick={signOut}><LogOut size={16} /> Keluar</button></div></div>;

  return <div className="page-stack"><div className="admin-page-header"><PageTitle eyebrow="ADMIN · AUTHENTICATED" title="Kelola katalog & materi" subtitle={`Masuk sebagai ${userEmail}. Setiap operasi tetap diperiksa oleh kebijakan RLS PostgreSQL.`} /><button className="button button-outline" onClick={signOut}><LogOut size={16} /> Keluar</button></div><div className="admin-safety-strip"><ShieldCheck size={17} /><span>Admin terlindungi · Supabase Auth + RLS · Tidak menggunakan service role key</span><button onClick={() => void loadData()}><Database size={15} /> Muat ulang data</button></div><div className="admin-tabs">{([["products", "Produk"], ["categories", "Kategori"], ["learning", "Materi belajar"], ["quizzes", "Soal kuis"]] as Array<[AdminTab, string]>).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}{id === "products" ? <small>{products.length}</small> : id === "categories" ? <small>{categories.length}</small> : id === "learning" ? <small>{learning.length}</small> : <small>{questions.length}</small>}</button>)}</div>
    {tab === "products" && <div className="admin-content-grid"><section className="panel admin-form-panel"><div className="section-heading"><div><span className="eyebrow">{editingId ? "EDIT PRODUK" : "DATA BARU"}</span><h2>{editingId ? "Perbarui produk" : "Tambah produk"}</h2></div><PackagePlus size={20} className="soft-icon" /></div><form onSubmit={saveProduct} className="admin-form"><label>Nama produk *<input value={form.name} onChange={(e) => handleProductChange("name", e.target.value)} required /></label><label>Slug *<input value={form.slug} onChange={(e) => handleProductChange("slug", e.target.value)} required pattern="[a-z0-9-]+" /></label><label>Kategori *<select value={form.category_id} onChange={(e) => handleProductChange("category_id", e.target.value)}>{[...CATEGORIES, ...categories.filter((c) => !CATEGORIES.some((x) => x.id === c.id)).map((c) => ({ id: String(c.id), name: String(c.name) }))].map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label><label>Subkategori<input value={form.subcategory} onChange={(e) => handleProductChange("subcategory", e.target.value)} /></label><label>Kode ukuran *<input value={form.code} onChange={(e) => handleProductChange("code", e.target.value)} required placeholder="misal #6 × 1 inch" /></label><label>Kunci ilustrasi lokal / URL<input value={form.image_key} onChange={(e) => handleProductChange("image_key", e.target.value)} placeholder="screw, bolt, plywood… atau URL Storage" /></label><label className="wide-field admin-file-label">Upload gambar ke Storage<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadProductImage(event)} /><small>JPG/PNG/WebP · maks. 5 MB · hanya admin</small></label><label className="wide-field">Alias pencarian (pisahkan koma)<input value={form.aliases} onChange={(e) => handleProductChange("aliases", e.target.value)} placeholder="misal fisher, plug dinding, fisher 8" /></label><label>Diameter kode (opsional)<input value={form.diameter_code} onChange={(e) => handleProductChange("diameter_code", e.target.value)} placeholder="#6 — jangan konversi ke mm tanpa referensi" /></label><label>Panjang nominal (mm)<input type="number" min="0" value={form.length_mm} onChange={(e) => handleProductChange("length_mm", e.target.value)} /></label><label>Ketebalan nominal (mm)<input type="number" min="0" value={form.thickness_mm} onChange={(e) => handleProductChange("thickness_mm", e.target.value)} /></label><label>Status spesifikasi<select value={form.verification} onChange={(e) => handleProductChange("verification", e.target.value)}><option value="example">Contoh / belum diverifikasi</option><option value="mathematical">Matematis / konversi</option><option value="verified">Terverifikasi pemilik</option></select></label><label className="wide-field">Deskripsi<textarea value={form.description} onChange={(e) => handleProductChange("description", e.target.value)} rows={2} /></label><label className="wide-field">Kegunaan<textarea value={form.uses} onChange={(e) => handleProductChange("uses", e.target.value)} rows={2} /></label><label className="wide-field">Catatan verifikasi<textarea value={form.note} onChange={(e) => handleProductChange("note", e.target.value)} rows={2} /></label><label className="wide-field">Spesifikasi teknis JSON<textarea value={form.specifications_json} onChange={(e) => handleProductChange("specifications_json", e.target.value)} rows={4} placeholder={'{"diameter_code": "#6", "length_mm": 25.4}'} /></label><div className="admin-form-actions"><button className="button button-primary" disabled={loading}><Save size={16} /> {editingId ? "Simpan perubahan" : "Tambah produk"}</button>{editingId && <button type="button" className="button button-outline" onClick={() => { setEditingId(null); setForm(defaultForm); }}>Batal</button>}</div></form></section><section className="panel admin-list-panel"><div className="admin-list-heading"><div><span className="eyebrow">KATALOG CLOUD</span><h2>{products.length} produk tersimpan</h2></div><div className="admin-list-actions"><button className="button button-outline" onClick={exportProducts}><ArrowDownToLine size={15} /> CSV</button><label className="button button-outline csv-upload"><ArrowUpFromLine size={15} /> Impor CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} /></label></div></div><label className="catalog-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter produk admin…" /></label><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Produk</th><th>Kode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filteredProducts.map((row) => <tr key={String(row.id)}><td><b>{String(row.name)}</b><small>{String(row.slug)}</small></td><td>{String(row.code)}</td><td><span className="verification-pill">{String(row.verification ?? "example")}</span></td><td><button className="icon-button" onClick={() => editProduct(row)} title="Edit"><Save size={15} /></button><button className="icon-button danger-icon" onClick={() => void deleteProduct(row)} title="Hapus"><Trash2 size={15} /></button></td></tr>)}</tbody></table>{loading && <p className="admin-loading">Memuat data…</p>}</div></section></div>}
    {tab === "categories" && <div className="admin-content-grid"><section className="panel admin-form-panel"><div className="section-heading"><div><span className="eyebrow">KATEGORI BARU</span><h2>Tambah / perbarui kategori</h2></div></div><form className="admin-form" onSubmit={addCategory}><label>ID kategori *<input value={categoryForm.id} onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required /></label><label>Slug<input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} /></label><label>Nama kategori *<input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required /></label><label>Ilustrasi key<input value={categoryForm.image_key} onChange={(e) => setCategoryForm({ ...categoryForm, image_key: e.target.value })} /></label><label className="wide-field">Deskripsi<textarea rows={3} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label><button className="button button-primary"><Plus size={16} /> Simpan kategori</button></form></section><section className="panel admin-list-panel"><div className="section-heading"><div><span className="eyebrow">DATABASE</span><h2>{categories.length} kategori cloud</h2></div></div>{categories.map((row) => <div className="admin-simple-row" key={String(row.id)}><div><b>{String(row.name)}</b><small>{String(row.id)} · {String(row.slug)}</small></div><button className="icon-button danger-icon" onClick={() => void deleteCategory(row)} title="Hapus kategori"><Trash2 size={15} /></button></div>)}</section></div>}
    {tab === "learning" && <div className="admin-content-grid"><section className="panel admin-form-panel"><div className="section-heading"><div><span className="eyebrow">MATERI BARU</span><h2>Tambah / perbarui modul</h2></div></div><form className="admin-form" onSubmit={addModule}><label>Slug *<input required value={moduleForm.slug} onChange={(e) => setModuleForm({ ...moduleForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} /></label><label>Judul *<input required value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} /></label><label>Kategori<input value={moduleForm.category} onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })} /></label><label>Menit<input type="number" min="1" value={moduleForm.minutes} onChange={(e) => setModuleForm({ ...moduleForm, minutes: e.target.value })} /></label><label className="wide-field">Intro<textarea value={moduleForm.intro} onChange={(e) => setModuleForm({ ...moduleForm, intro: e.target.value })} /></label><label className="wide-field">Isi materi (satu paragraf per baris)<textarea rows={3} value={moduleForm.body} onChange={(e) => setModuleForm({ ...moduleForm, body: e.target.value })} /></label><label className="wide-field">Ringkasan hafalan<input value={moduleForm.takeaway} onChange={(e) => setModuleForm({ ...moduleForm, takeaway: e.target.value })} /></label><label className="wide-field">Pertanyaan kuis<input value={moduleForm.question} onChange={(e) => setModuleForm({ ...moduleForm, question: e.target.value })} /></label><label className="wide-field">Pilihan (pisahkan dengan |)<input value={moduleForm.options} onChange={(e) => setModuleForm({ ...moduleForm, options: e.target.value })} placeholder="Pilihan A | Pilihan B | Pilihan C" /></label><label>Jawaban<input value={moduleForm.answer} onChange={(e) => setModuleForm({ ...moduleForm, answer: e.target.value })} /></label><label>Ilustrasi key<input value={moduleForm.image_key} onChange={(e) => setModuleForm({ ...moduleForm, image_key: e.target.value })} /></label><label className="wide-field">Penjelasan<input value={moduleForm.explanation} onChange={(e) => setModuleForm({ ...moduleForm, explanation: e.target.value })} /></label><button className="button button-primary"><Save size={16} /> Simpan materi</button></form></section><section className="panel admin-list-panel"><div className="section-heading"><div><span className="eyebrow">MATERI CLOUD</span><h2>{learning.length} modul</h2></div></div>{learning.map((row) => <div className="admin-simple-row" key={String(row.slug)}><div><b>{String(row.title)}</b><small>{String(row.slug)} · {String(row.category)}</small></div><button className="icon-button danger-icon" onClick={() => void deleteModule(row)} title="Hapus materi"><Trash2 size={15} /></button></div>)}</section></div>}
    {tab === "quizzes" && <div className="admin-content-grid"><section className="panel admin-form-panel"><div className="section-heading"><div><span className="eyebrow">BANK SOAL</span><h2>Tambah soal kuis</h2></div></div><form className="admin-form" onSubmit={addQuestion}><label>Kategori<select value={questionForm.category} onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}>{["konversi", "sekrup", "baut", "material", "mata-bor", "pengencang", "perkakas", "keselamatan"].map((x) => <option key={x}>{x}</option>)}</select></label><label className="wide-field">Pertanyaan *<textarea rows={3} value={questionForm.prompt} onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })} required /></label><label className="wide-field">Pilihan (pisahkan dengan |) *<input value={questionForm.options} onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })} required /></label><label>Jawaban benar *<input value={questionForm.answer} onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })} required /></label><label className="wide-field">Penjelasan<textarea rows={2} value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} /></label><button className="button button-primary"><Plus size={16} /> Tambah soal</button></form></section><section className="panel admin-list-panel"><div className="section-heading"><div><span className="eyebrow">BANK SOAL CLOUD</span><h2>{questions.length} pertanyaan</h2></div></div>{questions.map((row) => <div className="admin-question-row" key={String(row.id)}><div><b>{String(row.prompt)}</b><small>{String(row.category)} · Jawaban: {String(row.answer)}</small></div><button className="icon-button danger-icon" onClick={() => void deleteQuestion(row)} title="Hapus soal"><Trash2 size={15} /></button></div>)}</section></div>}
    <InfoNote>Operasi admin hanya menggunakan Supabase anon key + session login; izin insert/update/delete diputuskan RLS berdasarkan app_metadata. Upload gambar memakai Storage bucket terpisah jika dikonfigurasi.</InfoNote></div>;
}

function ReadOnlyAdmin({ notify }: { notify: (text: string) => void }) {
  function exportDemo() {
    const headers = ["name", "slug", "category_id", "subcategory", "code", "image_key", "description", "uses", "note", "verification", "aliases", "specifications"];
    const csv = [headers.join(","), ...PRODUCTS_DATA.map((product) => headers.map((key) => csvEscape(String(toCsvProduct(product)[key] ?? ""))).join(","))].join("\n");
    downloadFile("kayuukur-demo-products.csv", csv, "text/csv;charset=utf-8"); notify("CSV contoh katalog diunduh.");
  }
  return <div className="page-stack"><PageTitle eyebrow="MODE DEMO · READ ONLY" title="Admin & kelola katalog" subtitle="Backend cloud belum terhubung. Data demo tidak disimpan ke database; gunakan CSV untuk menyiapkan impor setelah Supabase dikonfigurasi." /><section className="admin-readonly-hero"><div className="readonly-icon"><LockKeyhole size={26} /></div><div><span className="eyebrow">PANEL DEMO AMAN</span><h2>Belum ada Supabase pada environment ini</h2><p>Mode ini sengaja <b>read-only</b>. Kami tidak berpura-pura bahwa perubahan lokal telah tersimpan di cloud. Isi environment Supabase dan jalankan migrasi SQL untuk mengaktifkan autentikasi serta CRUD.</p><div className="admin-readonly-actions"><button className="button button-primary" onClick={exportDemo}><ArrowDownToLine size={16} /> Ekspor contoh produk CSV</button><Link href="/catalog" className="button button-outline">Lihat katalog demo <ArrowRight size={15} /></Link></div></div></section><div className="admin-feature-grid"><div><Database size={19} /><b>PostgreSQL + RLS</b><span>Tabel kategori, produk, spesifikasi, materi, kuis, progres, favorit, dan riwayat.</span></div><div><LockKeyhole size={19} /><b>Auth aman</b><span>Tulis hanya untuk klaim app_metadata.role = admin; tidak ada service key di browser.</span></div><div><FileSpreadsheet size={19} /><b>CSV siap</b><span>Impor katalog saat Supabase aktif; data demo dapat diekspor untuk diedit.</span></div></div><AdminSetupHint /><InfoNote tone="warning">Agar admin dapat menambah produk secara online: siapkan project Supabase, isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, jalankan SQL migration dan seed. Buat klaim admin melalui proses server-side tepercaya; jangan pernah mengandalkan role yang dapat diubah pengguna dari browser.</InfoNote></div>;
}

function AdminSetupHint() { return <section className="panel admin-setup-hint"><span className="eyebrow">LANGKAH SETUP</span><h3>Aktifkan backend dalam empat langkah</h3><ol><li>Buat project Supabase PostgreSQL.</li><li>Jalankan <code>supabase/migrations/001_initial_schema.sql</code>, lalu seed bila dibutuhkan.</li><li>Tambahkan URL dan anon key pada <code>.env.local</code> / Vercel Environment Variables.</li><li>Berikan role admin pada <code>app_metadata</code> lewat Supabase Dashboard / Edge Function tepercaya.</li></ol><Link href="/about" className="text-link">Baca panduan deployment <ArrowRight size={14} /></Link></section>; }
function toCsvProduct(product: Product): Record<string, string> {
  const specifications = {
    ...(product.lengthIn !== undefined ? { length_in: product.lengthIn, length_mm: product.lengthIn * 25.4 } : {}),
    ...(product.lengthMm !== undefined ? { length_mm: product.lengthMm } : {}),
    ...(product.widthMm !== undefined ? { width_mm: product.widthMm } : {}),
    ...(product.thicknessMm !== undefined ? { thickness_mm: product.thicknessMm } : {}),
    ...(product.nominalDiameterMm !== undefined ? { nominal_diameter_mm: product.nominalDiameterMm } : {}),
    ...(product.diameterCode ? { diameter_code: product.diameterCode } : {}),
    ...(product.headType ? { head_type: product.headType } : {}), ...(product.threadType ? { thread_type: product.threadType } : {}),
    ...(product.material ? { material: product.material } : {}), ...(product.finish ? { finish: product.finish } : {}), ...(product.sheetSize ? { sheet_size_note: product.sheetSize } : {}),
  };
  return { name: product.name, slug: product.slug, category_id: product.categoryId, subcategory: product.subcategory, code: product.code, image_key: product.imageKey, description: product.description, uses: product.uses, note: product.note, verification: product.verification, aliases: product.aliases.join(" | "), specifications: JSON.stringify(specifications) };
}
function csvEscape(value: string) { return `"${value.replace(/"/g, '""')}"`; }
function downloadFile(name: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
function parseSpecifications(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null || String(value).trim() === "") return {};
  try { const parsed = JSON.parse(String(value)); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null; }
  catch { return null; }
}

function parseCsv(text: string): Array<Record<string, string>> {
  const records: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field); field = "";
      if (row.some((cell) => cell.length > 0)) records.push(row);
      row = [];
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); records.push(row); }
  if (records.length < 2) return [];
  const headers = records[0].map((header) => header.trim());
  return records.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}
