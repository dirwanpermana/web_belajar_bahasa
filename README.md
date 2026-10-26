# Kata Kerja – Pelatih Bicara Inggris & Malaysia untuk QA

Website statis (PWA) yang bisa dibuka di HP dan dipasang di layar utama seperti aplikasi.
Semua fitur belajar berjalan di browser. Fitur **guru AI** (cerita harian, dialog panjang,
penilaian kalimat, tips pelafalan, penilaian jawaban interview) memakai endpoint opsional `/api/ai`.

## Struktur

```
.
├── index.html               # seluruh aplikasi (HTML + CSS + JS + data materi)
├── manifest.webmanifest     # metadata PWA (nama, ikon, warna)
├── sw.js                    # service worker: bisa dibuka offline setelah kunjungan pertama
├── icons/                   # ikon 192, 512, maskable, apple-touch-icon
├── api/ai.js                # Vercel Function: proxy ke Claude API (opsional)
├── netlify/functions/ai.js  # versi Netlify dari api/ai.js (opsional)
├── netlify.toml / vercel.json
└── package.json
```

## Opsi A – Vercel (disarankan, dengan guru AI)

1. Push folder ini ke repo GitHub.
2. Di Vercel: **Add New → Project → Import** repo tersebut. Framework preset: **Other**. Tidak ada build command; output directory biarkan default (root).
3. **Settings → Environment Variables**:

   | Nama | Wajib | Keterangan |
   |---|---|---|
   | `ANTHROPIC_API_KEY` | ya (untuk AI) | API key dari Claude Console |
   | `ACCESS_CODE` | sangat disarankan | kode rahasia; isi juga di aplikasi: Pengaturan → Kode akses guru AI |
   | `MODEL_DEFAULT` | tidak | default `claude-sonnet-5-5` (cerita & dialog) |
   | `MODEL_QUICK` | tidak | default `claude-haiku-5-5` (penilaian & tips) |
   | `MAX_PER_HOUR` | tidak | batas permintaan per IP per jam, default `120` |
   | `ALLOWED_ORIGIN` | tidak | isi jika frontend di domain lain dari API |

4. Deploy, lalu buka `https://<proyekmu>.vercel.app/api/ai` → harus tampil `{"ok":true,"ai":true,...}`.

CLI alternatif: `npm i -g vercel && vercel` lalu `vercel env add ANTHROPIC_API_KEY` dan `vercel --prod`.

## Opsi B – Netlify (dengan guru AI)

Import repo di Netlify (publish directory `.`, tanpa build command). `netlify.toml` sudah memetakan `/api/ai`
ke `netlify/functions/ai.js`. Tambahkan environment variable yang sama seperti tabel di atas.

## Opsi C – Hosting statis saja (GitHub Pages, Cloudflare Pages, Firebase Hosting, Nginx)

Upload `index.html`, `manifest.webmanifest`, `sw.js`, dan folder `icons/`. Semua fitur jalan kecuali guru AI:
cerita memakai 8 cerita pilihan bawaan, dialog memakai versi 6–13 baris, dan penilaian kalimat menampilkan contoh pembanding.
Jika API dipasang di domain lain, tambahkan sebelum `<script>` di `index.html`:
`<script>window.KK_AI_URL = 'https://api-domainmu/api/ai'</script>` dan isi `ALLOWED_ORIGIN` di server.

## Memasang di HP

- **Android (Chrome):** buka situs → menu ⋮ → *Tambahkan ke layar utama* / *Instal aplikasi*.
- **iPhone (Safari):** buka situs → tombol Bagikan → *Tambah ke Layar Utama*.
- Mikrofon **wajib HTTPS** (Vercel/Netlify otomatis HTTPS). Izinkan akses mikrofon saat diminta.

## Dukungan perangkat

| Fitur | Chrome Android | Safari iOS | Chrome/Edge desktop | Firefox |
|---|---|---|---|---|
| Audio (text-to-speech) | ✓ | ✓ | ✓ | ✓ |
| Rekam & nilai pelafalan | ✓ | ✓ (iOS 14.5+) | ✓ | ✗ |

Suara Bahasa Malaysia tergantung perangkat (Android dengan Google TTS biasanya ada). Jika tidak ada, dipakai suara Bahasa Indonesia.

## Progres & cadangan

Progres (terpisah per bahasa) disimpan di `localStorage` browser. Artinya progres **per perangkat dan per browser**.
Gunakan **Pengaturan → Ekspor progres** untuk membuat file cadangan `.json`, lalu **Impor progres** di perangkat lain.
Menghapus data situs di browser akan menghapus progres, jadi ekspor secara berkala.

## Uji lokal

```bash
npx --yes serve .          # tanpa AI, buka http://localhost:3000
vercel dev                 # dengan AI (butuh ANTHROPIC_API_KEY di .env.local)
```

Catatan: service worker dan mikrofon hanya aktif di `http://localhost` atau HTTPS, tidak dari `file://`.

## Keamanan & biaya

- API key hanya ada di server (environment variable), tidak pernah dikirim ke browser.
- Pasang `ACCESS_CODE`, karena tanpa itu siapa pun yang tahu URL-mu bisa memakai kuota API-mu.
- Rate limit bawaan bersifat per instance serverless (best effort). Untuk perlindungan lebih kuat, pasang
  batas pengeluaran di Claude Console atau rate limit di level platform (misalnya Vercel Firewall).
- Cerita dan dialog panjang disimpan di browser setelah dibuat, jadi tiap hari hanya dibuat sekali per perangkat.
- Dokumentasi Claude API (API key, model, harga): https://docs.claude.com/en/api/overview

## Mengubah materi

Semua materi ada di `index.html` sebagai objek JavaScript: `RAW`, `X`, `W` (kosakata), `G` (rumus),
`D` (dialog harian), `IQ` (interview), `STORIES` (cerita), `CONVS` (percakapan), `SB_RULES`/`SB_LADDERS` (susun kalimat).
Setelah mengubah, naikkan `CACHE` di `sw.js` (misalnya `kata-kerja-v2`) agar HP mengambil versi baru.
