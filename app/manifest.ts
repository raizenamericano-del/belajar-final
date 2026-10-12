import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KayuUkur Pro",
    short_name: "KayuUkur",
    description: "Hafal ukuran, kenali barang, kerja makin cepat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f3eb",
    theme_color: "#202522",
    lang: "id-ID",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/images/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    categories: ["education", "productivity", "utilities"],
  };
}
