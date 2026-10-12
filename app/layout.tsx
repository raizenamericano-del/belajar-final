import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KayuUkur Pro — Hafal Ukuran, Kenali Barang", template: "%s | KayuUkur Pro" },
  description: "Kalkulator inci ke cm dan mm, ensiklopedia hardware, tabel hafalan, game edukatif, dan panduan perkayuan untuk Android dan desktop.",
  applicationName: "KayuUkur Pro",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "KayuUkur Pro", statusBarStyle: "black-translucent" },
  keywords: ["konversi inci cm", "ukuran sekrup", "triplek", "hardware", "perkakas kayu", "inci ke mm"],
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/images/logo.svg", type: "image/svg+xml" }], apple: "/icons/icon-192.png" },
  openGraph: { title: "KayuUkur Pro", description: "Hafal Ukuran, Kenali Barang, Kerja Makin Cepat.", type: "website", locale: "id_ID" },
};

export const viewport: Viewport = {
  themeColor: "#202522",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body>{children}</body></html>;
}
