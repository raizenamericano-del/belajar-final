"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight, Boxes, Drill, Hammer, Ruler, ShieldCheck, Wrench, Package, Heart, Star,
  Gauge, Paintbrush, Disc3, CircleDot, Sparkles, GraduationCap, Shield,
  type LucideIcon,
} from "lucide-react";
import type { Category, Product } from "@/lib/data";

const imageFallback: Record<string, string> = { drill: "drill-bit", machine: "router-bit", furniture: "furniture-hardware", nail: "fastener", sheet: "plywood", screw: "screw", bolt: "bolt", disc: "grinding-disc", tool: "hand-tools", measure: "measuring-tools", paint: "finishing", safety: "safety" };
const categoryIcons: Record<string, LucideIcon> = {
  screw: CircleDot, bolt: Wrench, nail: Hammer, sheet: Boxes, drill: Drill, disc: Disc3,
  tool: Wrench, measure: Ruler, paint: Paintbrush, safety: ShieldCheck, furniture: Package, machine: Gauge,
};

export function ProductArt({ imageKey, alt, className = "", priority = false }: { imageKey: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const remoteImage = /^https?:\/\//i.test(imageKey);
  const src = remoteImage && !failed ? imageKey : `/images/${failed ? (imageFallback[imageKey] ?? "hand-tools") : imageKey}.svg`;
  return failed && (imageFallback[imageKey] ?? imageKey) === "hand-tools" ? (
    <div className={`product-art product-art-fallback ${className}`} role="img" aria-label={alt}><Package size={34} /><span>Ilustrasi {alt}</span></div>
  ) : (
    <div className={`product-art ${className}`}>
      <Image src={src} alt={alt} width={480} height={320} unoptimized priority={priority} onError={() => setFailed(true)} />
    </div>
  );
}

export function CategoryIcon({ category, size = 23 }: { category: Category; size?: number }) {
  const Icon = categoryIcons[category.icon] ?? Package;
  return <span className={`category-icon category-icon-${category.accent}`}><Icon size={size} strokeWidth={1.8} /></span>;
}

export function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="page-title-row"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>{action && <div className="page-title-action">{action}</div>}</div>;
}

export function ProductCard({ product, favorite, onToggleFavorite, compact = false }: { product: Product; favorite: boolean; onToggleFavorite: (id: string) => void; compact?: boolean }) {
  return (
    <article className={`product-card ${compact ? "product-card-compact" : ""}`}>
      <Link href={`/catalog/${product.slug}`} className="product-card-image" aria-label={`Lihat detail ${product.name}`}>
        <ProductArt imageKey={product.imageKey} alt={`Ilustrasi ${product.name}`} />
        <span className="image-badge">Ilustrasi</span>
      </Link>
      <div className="product-card-body">
        <div className="product-card-meta"><span className="eyebrow-mini">{product.subcategory}</span><button className={`icon-button favorite-toggle ${favorite ? "is-favorite" : ""}`} onClick={() => onToggleFavorite(product.slug)} aria-label={favorite ? "Hapus dari favorit" : "Tambahkan ke favorit"}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div>
        <Link href={`/catalog/${product.slug}`} className="product-card-title">{product.name}</Link>
        <p>{product.lengthIn !== undefined ? `Panjang nominal ${product.code.split("×").pop()?.trim() ?? ""}.` : product.code}</p>
        <div className="product-card-footer"><span className="verification-pill">{product.verification === "verified" ? "Terverifikasi pemilik" : product.verification === "mathematical" ? "Matematis" : "Contoh katalog"}</span><Link href={`/catalog/${product.slug}`} className="text-link">Detail <ArrowUpRight size={14} /></Link></div>
      </div>
    </article>
  );
}

export function EmptyState({ icon = "package", title, body, action }: { icon?: string; title: string; body: string; action?: React.ReactNode }) {
  const Icon = icon === "heart" ? Heart : icon === "search" ? Sparkles : Package;
  return <div className="empty-state"><span className="empty-icon"><Icon size={26} /></span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

export function StatCard({ label, value, detail, icon, tone = "orange" }: { label: string; value: string | number; detail: string; icon: React.ReactNode; tone?: string }) {
  return <div className={`stat-card stat-${tone}`}><div className="stat-icon">{icon}</div><div><span className="stat-label">{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

export function InfoNote({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warning" | "success" }) {
  return <div className={`info-note info-${tone}`}><span>{tone === "success" ? <Star size={17} /> : tone === "warning" ? <Shield size={17} /> : <GraduationCap size={17} />}</span><div>{children}</div></div>;
}
