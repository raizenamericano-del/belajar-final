"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, ArrowRight, Check, Clipboard, Copy, Heart, Info, RotateCcw, Ruler } from "lucide-react";
import { convert, displayConversion, formatConvertedValue, formatInches, formatNumber, parseMeasurement, type ConversionMode, type ExactRational, type Unit, UNIT_LABELS } from "@/lib/conversion";
import { FRACTION_ROWS } from "@/lib/data";
import { readList, writeList, type ConversionHistoryEntry } from "@/lib/storage";

const UNITS: Unit[] = ["in", "ft", "m", "cm", "mm"];
const UNIT_SHORT: Record<Unit, string> = { in: "inci", ft: "ft", m: "m", cm: "cm", mm: "mm" };

function formattedResult(value: number, from: Unit, to: Unit, mode: ConversionMode, exactValue?: ExactRational | null) {
  const exact = convert(value, from, to);
  if (mode === "accurate") return formatConvertedValue(value, from, to, exactValue);
  if (mode === "easy" && from === "in" && to === "cm") {
    const known = displayConversion(value, from, "easy").cm;
    return { text: known, symbol: "≈" as const };
  }
  if (mode === "shop" && to === "mm") return { text: formatNumber(Math.round(exact), 0), symbol: "≈" as const };
  return { text: formatNumber(Math.round(exact * (to === "mm" ? 1 : 10)) / (to === "mm" ? 1 : 10), to === "mm" ? 0 : 1), symbol: "≈" as const };
}

export function ConverterPage({ onHistory, notify, initialInput, initialTarget }: { onHistory: (entry: Omit<ConversionHistoryEntry, "id" | "timestamp">) => void; notify: (text: string) => void; initialInput?: string; initialTarget?: Unit }) {
  const [input, setInput] = useState(initialInput ?? "3/4");
  const [sourceUnit, setSourceUnit] = useState<Unit>("in");
  const [targetUnit, setTargetUnit] = useState<Unit>("cm");
  const [mode, setMode] = useState<ConversionMode>("easy");
  const [precision, setPrecision] = useState("3");
  const [saved, setSaved] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => { setFavorites(readList<string>("favoriteConversions")); }, []);
  useEffect(() => { if (initialInput) setInput(initialInput); }, [initialInput]);
  useEffect(() => { if (initialTarget) setTargetUnit(initialTarget); }, [initialTarget]);

  const parsed = useMemo(() => parseMeasurement(input, sourceUnit), [input, sourceUnit]);
  const activeUnit = parsed?.unit ?? sourceUnit;
  const primary = parsed ? formattedResult(parsed.value, activeUnit, targetUnit, mode, parsed.exactValue) : null;
  const exactPrimary = parsed ? convert(parsed.value, activeUnit, targetUnit) : 0;
  const cmOut = parsed ? formattedResult(parsed.value, activeUnit, "cm", mode, parsed.exactValue) : null;
  const mmOut = parsed ? formattedResult(parsed.value, activeUnit, "mm", mode, parsed.exactValue) : null;
  const inchOut = parsed ? formatConvertedValue(parsed.value, activeUnit, "in", parsed.exactValue) : null;
  const exactMode = mode === "accurate";
  const inputDescription = parsed ? `${formatNumber(parsed.value, 4)} ${UNIT_LABELS[activeUnit]}` : "";

  useEffect(() => {
    if (!parsed || !primary || input.trim().length < 1) { setSaved(false); return; }
    const timer = window.setTimeout(() => {
      const label = `${primary.symbol} ${primary.text} ${UNIT_SHORT[targetUnit]}`;
      onHistory({ input: input.trim(), from: UNIT_LABELS[activeUnit], to: UNIT_LABELS[targetUnit], result: label });
      setSaved(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [input, activeUnit, targetUnit, mode]); // onHistory is a stable app action.

  const swapUnits = () => {
    setSourceUnit(targetUnit);
    setTargetUnit(activeUnit);
    setInput(`${formatNumber(exactPrimary, Number(precision))} ${UNIT_SHORT[targetUnit]}`);
    setSaved(false);
  };
  const reset = () => { setInput(""); setSaved(false); };

  async function copyPrimary() {
    if (!parsed || !primary) return;
    const text = `${input.trim()} ${primary.symbol} ${primary.text} ${UNIT_SHORT[targetUnit]}`;
    try { await navigator.clipboard.writeText(text); notify("Hasil konversi disalin."); }
    catch { notify("Salin otomatis tidak tersedia di browser ini."); }
  }

  function toggleFavorite() {
    if (!parsed || !primary) return;
    const key = `${input.trim()} → ${primary.text} ${UNIT_SHORT[targetUnit]}`;
    const next = favorites.includes(key) ? favorites.filter((f) => f !== key) : [key, ...favorites].slice(0, 30);
    setFavorites(next); writeList("favoriteConversions", next); notify(next.includes(key) ? "Konversi disimpan ke favorit." : "Favorit konversi dihapus.");
  }

  const popular = FRACTION_ROWS.filter((row) => [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].includes(row.inches));

  return (
    <div className="page-stack">
      <section className="converter-workbench">
        <div className="converter-topline"><div><span className="eyebrow">ALAT CEPAT · RUMUS EKSak</span><h2>Konversi ukuran</h2><p>Masukkan inci, pecahan, atau satuan metrik. Hasil muncul saat Anda mengetik.</p></div><div className="formula-chip"><span>1 inch</span><ArrowRight size={14} /><strong>25,4 mm</strong></div></div>
        <div className="converter-mode" role="tablist" aria-label="Mode konversi">
          {[{ id: "easy", label: "Gampang", note: "Cepat diingat" }, { id: "shop", label: "Toko", note: "Praktis" }, { id: "accurate", label: "Akurat", note: "Nilai eksak" }].map((item) => <button key={item.id} className={`mode-tab ${mode === item.id ? "active" : ""}`} role="tab" aria-selected={mode === item.id} onClick={() => setMode(item.id as ConversionMode)}><b>{item.label}</b><small>{item.note}</small></button>)}
        </div>
        <div className="converter-input-row">
          <label className="input-block"><span>Ukuran yang diketahui</span><div className={`measurement-input ${parsed ? "valid" : input ? "invalid" : ""}`}><input type="text" inputMode="text" autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="done" aria-label="Masukkan ukuran, termasuk pecahan campuran" placeholder="misal 1 1/4 atau 25 mm" value={input} onChange={(event) => { setInput(event.target.value); setSaved(false); }} onKeyDown={(event) => { if (event.key === "Escape") reset(); }} /><select aria-label="Satuan asal" value={sourceUnit} onChange={(event) => { setSourceUnit(event.target.value as Unit); setSaved(false); }}>{UNITS.map((unit) => <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}</select></div></label>
          <button className="swap-button" onClick={swapUnits} aria-label="Tukar satuan asal dan tujuan"><ArrowDownUp size={19} /></button>
          <label className="input-block target-select"><span>Konversi ke</span><div className="select-control"><select value={targetUnit} aria-label="Pilih satuan tujuan" onChange={(event) => setTargetUnit(event.target.value as Unit)}>{UNITS.map((unit) => <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}</select></div></label>
        </div>
        {!parsed && input && <p className="input-error">Format belum terbaca. Coba <b>3/4</b>, <b>1 1/4</b>, <b>0,75</b>, atau <b>25 mm</b>.</p>}
        <div className="quick-inputs" aria-label="Contoh cepat"><span>Contoh:</span>{["3/4", "1 1/4", "1 1/2", "25 mm"].map((example) => <button key={example} onClick={() => { setInput(example); if (example.includes("mm")) setSourceUnit("mm"); else setSourceUnit("in"); setSaved(false); }}>{example}</button>)}<span className="quick-input-hint">Pecahan campuran bisa memakai spasi, contoh 1 1/4.</span></div>
        <details className="fraction-picker"><summary><span><Ruler size={15} /> Pilih dari tabel ukuran</span><span>{FRACTION_ROWS.length} ukuran <ArrowRight size={13} /></span></summary><div className="fraction-picker-grid">{FRACTION_ROWS.map((row) => { const label = formatInches(row.inches); const active = parsed?.unit === "in" && parsed.value === row.inches; return <button type="button" key={row.inches} className={active ? "active" : ""} onClick={() => { setInput(label); setSourceUnit("in"); setSaved(false); }}><b>{label}″</b><small>≈ {formatNumber(row.cm, 1)} cm</small></button>; })}</div><div className="metric-picker"><span>Ukuran metrik cepat</span>{["6 mm", "8 mm", "10 mm", "12 mm", "16 mm", "19 mm", "25,4 mm"].map((size) => <button type="button" key={size} onClick={() => { setInput(size); setSourceUnit("mm"); setSaved(false); }}>{size}</button>)}</div></details>
        {parsed && primary ? <div className="conversion-result">
          <div className="result-main"><div><span className="result-caption">HASIL {exactMode ? "AKURAT" : "PRAKTIS"}</span><p className="result-expression">{inputDescription} <ArrowRight size={17} /> {UNIT_LABELS[targetUnit]}</p><strong><em>{primary.symbol}</em> {primary.text} <small>{UNIT_SHORT[targetUnit]}</small></strong><div className="result-exact">{exactMode ? (primary.symbol === "=" ? "Hasil desimal ini eksak; tidak dibulatkan." : "Hasil berupa desimal berulang; angka di atas ditandai ≈ dan ditampilkan hingga 12 desimal.") : `Nilai hitung: ≈ ${formatNumber(exactPrimary, 12)} ${UNIT_SHORT[targetUnit]} (detail lebih presisi tersedia pada mode Akurat).`}</div></div><div className="result-actions"><button className="button button-outline" onClick={copyPrimary}><Copy size={16} /> Salin</button><button className={`icon-button result-fav ${saved ? "" : ""}`} title="Simpan konversi favorit" aria-label="Simpan konversi favorit" onClick={toggleFavorite}><Heart size={18} /></button><button className="icon-button" title="Reset" aria-label="Reset input" onClick={reset}><RotateCcw size={17} /></button></div></div>
          <div className="secondary-results"><div><span>Sentimeter</span><b>{cmOut?.symbol} {cmOut?.text} <small>cm</small></b></div><div><span>Milimeter</span><b>{mmOut?.symbol} {mmOut?.text} <small>mm</small></b></div><div><span>Inci</span><b>{inchOut?.symbol} {inchOut?.text} <small>in</small></b></div></div>
          {saved && <span className="saved-indicator"><Check size={13} /> Tersimpan di riwayat</span>}
        </div> : <div className="conversion-placeholder"><RulerPlaceholder /><span>Hasil akan tampil langsung di sini</span></div>}
        <div className="converter-foot"><Info size={15} /><span>Perhitungan memakai nilai eksak <b>1 inch = 25,4 mm</b>. Pembulatan hanya untuk tampilan.</span><label className="precision-control">Presisi <select value={precision} onChange={(e) => setPrecision(e.target.value)}><option value="2">2 desimal</option><option value="3">3 desimal</option><option value="4">4 desimal</option></select></label></div>
      </section>
      <div className="two-column-grid">
        <section className="panel related-panel"><div className="section-heading"><div><span className="eyebrow">HAFALAN TOKO</span><h3>Ukuran yang sering dipakai</h3></div><a href="/fractions" className="text-link">Lihat tabel <ArrowRight size={15} /></a></div><div className="popular-size-list">{popular.map((row) => <button key={row.inches} className="popular-size" onClick={() => { setInput(formatInches(row.inches)); setSourceUnit("in"); }}><span>{row.label}</span><b>≈ {formatNumber(row.cm, 1)} cm</b><small>≈ {row.mm} mm</small></button>)}</div></section>
        <section className="panel formula-panel"><span className="formula-icon"><Info size={18} /></span><h3>Rumus sederhana</h3><div className="formula-equation">inch × 25,4 <span>=</span> mm</div><div className="formula-equation">inch × 2,54 <span>=</span> cm</div><p>Contoh 3/4″: 0,75 × 25,4 = <b>19,05 mm</b>, atau 1,905 cm.</p><button className="text-link" onClick={() => notify("Faktor konversi ini eksak; pembulatan hanya digunakan untuk tampilan.")}><Clipboard size={15} /> Penjelasan rumus</button></section>
      </div>
    </div>
  );
}

function RulerPlaceholder() { return <div className="mini-ruler" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>; }
