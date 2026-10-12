# KayuUkur Pro

**Hafal Ukuran, Kenali Barang, Kerja Makin Cepat.**

Aplikasi web berbahasa Indonesia untuk konversi inch–cm–mm, referensi ukuran pecahan, ensiklopedia perkayuan/hardware, game belajar, kalkulator material, progres lokal, dan PWA.

## Yang sudah berfungsi

- Konverter langsung untuk pecahan campuran, desimal titik/koma, inch, ft, meter, cm, dan mm; faktor internal eksak (`1 inch = 25,4 mm`). Mode Gampang, Toko, dan Akurat, tukar satuan, salin, favorit, dan riwayat.
- Tabel 26 ukuran hafalan, pencarian, tampilan tabel/kartu, tanda hafalkan, ilustrasi penggaris, dan kuis.
- Katalog **197 contoh produk** di 13 kategori—keluarga sekrup beragam, baut, mur, ring, fisher, panel, mata bor, cakram, perkakas, finishing, K3, serta hardware furnitur. Semua gambar adalah **ilustrasi original**, bukan foto produk.
- Halaman detail barang, filter, smart search, favorit, dan perbandingan dua barang.
- 12 permainan interaktif: tebak cm, tebak inci, ukuran dari gambar, tebak barang, ukuran sekrup, benar/salah, speed quiz, memory match, level-up, simulasi toko, tantangan harian, dan practice mode. XP, level, akurasi, streak, badge, serta soal salah tersimpan di browser.
- 18 materi belajar singkat dengan kuis.
- Kalkulator luas/volume lembar, estimasi pola potong (termasuk kerf dan margin), harga per buah, diameter, dan berat.
- Panel admin demo **read-only** jika Supabase belum disiapkan. Jika Supabase aktif, admin memakai Supabase Auth, cek `app_metadata.role = admin`, Row Level Security, CRUD produk/kategori/materi/soal, validasi, CSV impor/ekspor, dan upload gambar JPG/PNG/WebP ke Storage.
- PWA, ikon, manifest, offline fallback, service worker yang tidak menyimpan halaman admin/API, tema terang/gelap, dan layout responsif.

> Dataset katalog adalah **contoh referensi**, bukan jaminan stok, harga, merek, atau spesifikasi produk tertentu. Status “Contoh” harus diverifikasi pemilik toko terhadap kemasan/datasheet sebelum dipakai sebagai spesifikasi jual. Kode `#6/#8` tidak dikonversi otomatis menjadi diameter mm. `M8` berarti diameter nominal ulir 8 mm, bukan panjang baut. Harga/stok tidak dikarang.

## Teknologi

- Next.js App Router 16, React 19, TypeScript
- CSS responsif tanpa dependency font/CDN eksternal
- Supabase PostgreSQL/Auth/Storage opsional; local demo berjalan tanpa credentials
- Vitest, ESLint flat config
- Vercel-compatible; route health: `/api/health`

## Menjalankan lokal

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Tanpa environment Supabase, katalog/game/kalkulator menggunakan seed lokal dan halaman `/admin` berstatus read-only. Data XP, favorit, riwayat, pencarian, dan materi selesai disimpan di `localStorage` browser itu saja.

## Supabase: schema, seed, dan admin

1. Buat project Supabase PostgreSQL.
2. Buka **SQL Editor** dan jalankan `supabase/migrations/001_initial_schema.sql`.
3. (Opsional) Buat seed lengkap dari dataset aplikasi:

   ```bash
   npm run seed:export
   SUPABASE_URL="https://PROJECT.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="..." npm run seed:supabase
   ```

   Seed memasukkan kategori, **197 produk**, 20 faktor unit, 18 modul, 34 soal, dan badge. Kunci service-role hanya dipakai oleh script CLI lokal untuk seed; jangan commit, jangan taruh di `NEXT_PUBLIC_*`, dan jangan gunakan pada runtime frontend/Vercel.
4. Isi `.env.local` dengan **Project URL** dan **anon/publishable key** saja:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

5. Buat akun pengelola melalui Supabase Auth. Berikan `app_metadata.role = "admin"` melalui Dashboard atau proses server-side tepercaya. Jangan membuat endpoint publik yang mengizinkan pengguna mengubah role. Kebijakan SQL menolak operasi tulis jika claim admin tidak ada.
6. Refresh aplikasi. Katalog publik membaca baris `is_published`; route `/admin` meminta email/kata sandi dan PostgreSQL RLS tetap menjadi penjaga utama. Bucket `product-images` dibatasi 5 MB untuk JPG/PNG/WebP pada UI admin; upload hanya untuk admin.

### Tabel utama

`categories`, `products`, `product_images`, `product_specifications`, `aliases`, `unit_conversions`, `learning_modules`, `quizzes`, `quiz_questions`, `achievements`, `user_progress`, `favorites`, `conversion_history`, `user_preferences`.

Data pribadi cloud memakai policy berbasis `auth.uid()`. Build demo tidak mengirim progres localStorage ke Supabase dan tidak mengklaim sinkronisasi jika pengguna belum login. Operasi data admin menggunakan anon key + session admin; tidak ada service-role key browser.

## CSV katalog

Panel admin menerima CSV UTF-8 dengan header:

```csv
name,slug,category_id,subcategory,code,image_key,description,uses,note,verification,aliases,specifications
Sekrup toko contoh,sekrup-toko-contoh,sekrup,Contoh,#6 × 1 inch,screw,Entri contoh,Cocokkan dengan kemasan,Verifikasi dulu,example,"fisher | plug dinding","{""diameter_code"":""#6"",""length_mm"":25.4}"
```

`name`, `slug`, `category_id`, `code` wajib. Status yang diterima: `example`, `mathematical`, `verified`. Slug huruf kecil/angka/tanda hubung. Ukuran tambahan disimpan di `specifications` sebagai JSON; jangan isi diameter mm dari kode `#` tanpa sumber.

Gambar lokal tersedia di `public/images/`. `image_key` memakai nama aset tanpa ekstensi (contoh `screw`, `bolt`, `plywood`, `drill-bit`, `measuring-tools`). Admin dapat mengunggah JPG/PNG/WebP ke Storage; URL publik tersimpan sebagai `image_key`. Tambahkan gambar lokal baru beserta fallback dan alt text di `ProductArt` jika tidak memakai Storage.

## Deploy ke GitHub & Vercel

1. Buat repository GitHub baru lalu commit seluruh file proyek (jangan commit `.env.local`, build, atau `node_modules`).
2. Import repository pada Vercel. Framework akan terdeteksi sebagai Next.js; build command `npm run build`, install command `npm ci`.
3. Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` pada Vercel **Production, Preview, dan Development** jika mengaktifkan backend. Jangan tambahkan service-role ke environment runtime frontend.
4. Deploy. Periksa `/api/health` untuk mengetahui mode `local-demo` atau `supabase-configured`.
5. Untuk mode demo tanpa cloud, environment Supabase tidak perlu dibuat.

Tidak ada kebutuhan filesystem persisten atau server lokal yang harus berjalan. Semua aset ilustrasi di dalam repository. App Router dan API health kompatibel dengan deployment Vercel Node runtime.

## PWA & offline

- Halaman kalkulator, tabel, katalog, bank soal, ikon, dan aset dasar dapat dicache oleh service worker.
- Setelah deploy/install, buka aplikasi sekali saat online agar shell dan route awal tersimpan. Saat offline, kalkulator berjalan di perangkat karena rumus dan data referensi berada di bundle lokal.
- Route `/admin` dan `/api/*` tidak pernah dicache. Data personal tetap di localStorage pada perangkat.
- Browser Android mendukung **Tambahkan ke layar utama** dari menu browser; prompt instalasi tampil bila event `beforeinstallprompt` tersedia.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Tes mencakup faktor unit yang diminta, parser pecahan/campuran/koma/unit/invalid, pembulatan, smart search, dataset minimal 150 contoh, scoring/XP/streak/level, validasi produk/soal, kalkulator panel/potong/harga/berat.

## Struktur penting

```text
app/                     App Router, manifest, health API
components/               Dashboard, converter, katalog, game, belajar, admin, tools
lib/                      Rumus, dataset seed, pencarian, progres, validasi
public/images/            Ilustrasi produk SVG buatan sendiri
public/sw.js              Strategi cache/offline
supabase/migrations/      PostgreSQL schema + RLS
supabase/seed-data.json   Dataset hasil export generator
scripts/                  Export seed dan seed CLI Supabase
```
