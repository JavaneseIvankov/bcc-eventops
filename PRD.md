# Product Requirements Document (PRD) — BCC EventOps

* **Status:** Approved for Development (v1.0)
* **Konteks:** Internal Hackathon (Durasi 12 Jam)
* **Komposisi Tim:** 2 Frontend (Next.js), 2 Backend (Go Fiber)
* **Target Infrastruktur:** Single VM Deployment (Docker + CI/CD Mandiri + Redis + PostgreSQL + Monitoring Stack)

---

## 1. Ringkasan Produk & Tujuan
**BCC EventOps** adalah platform operasional terpadu untuk kegiatan internal & eksternal BCC (workshop, upgrading, seminar, open house). Aplikasi ini menggabungkan katalog pendaftaran peserta, manajemen kepanitiaan berbasis *role* per event, *rundown* sesi *realtime*, meja *check-in* anti-duplikasi, pengumuman langsung, serta *dashboard* statistik kehadiran.

### Target Milestone (12 Jam)
* **Jam ke-0 s.d. ke-6 (Core E2E Flow):** Auth $\rightarrow$ Buat Event $\rightarrow$ Undang Panitia $\rightarrow$ Buat Sesi $\rightarrow$ Peserta Daftar (Safe Quota) $\rightarrow$ Panitia Check-in.
* **Jam ke-6 s.d. ke-12 (Realtime, Polish & Ops):** Integrasi WebSocket (2 channel), animasi UI (`prefers-reduced-motion`), Redis caching, testing, CI/CD, dan deployment di VM.

---

## 2. Matriks Role & Otorisasi (Berlaku Spesifik per Event)

Status kepanitiaan dan status pendaftaran peserta **bersifat terpisah**. Anggota panitia/koordinator tidak otomatis memotong kuota peserta, namun tetap diizinkan mendaftar sebagai peserta jika ingin mengikuti acara.

| Fitur / Aksi | Pengguna Umum / Peserta | Panitia (`COMMITTEE`) | Koordinator (`COORDINATOR`) |
| :--- | :---: | :---: | :---: |
| Lihat katalog, detail event, rundown, & pengumuman | $\checkmark$ | $\checkmark$ | $\checkmark$ |
| Daftar event & batalkan pendaftaran diri sendiri (saat `UPCOMING`) | $\checkmark$ | $\checkmark$ | $\checkmark$ |
| Buat event baru (Otomatis jadi `COORDINATOR`) | $\checkmark$ | $\checkmark$ | $\checkmark$ |
| Edit detail event, ubah kuota/status event, & hapus event | $\times$ | $\times$ | $\checkmark$ |
| Undang panitia, batalkan undangan, ubah role, & keluarkan panitia | $\times$ | $\times$ | $\checkmark$ |
| Keluar mandiri dari kepanitiaan | $\times$ | $\checkmark$ | $\checkmark$ *(Min. sisa 1 Koordinator)* |
| Buat, edit, dan hapus sesi rundown | $\times$ | $\times$ | $\checkmark$ |
| Ubah status sesi (`UPCOMING` $\rightarrow$ `ONGOING` $\rightarrow$ `FINISHED`) | $\times$ | $\checkmark$ | $\checkmark$ |
| Buat, edit, dan hapus pengumuman event | $\times$ | $\checkmark$ | $\checkmark$ |
| Lihat dashboard operasional & tabel daftar peserta | $\times$ | $\checkmark$ | $\checkmark$ |
| Check-in peserta (Manual & Scan QR) | $\times$ | $\checkmark$ | $\checkmark$ |
| Batalkan pendaftaran peserta lain | $\times$ | $\times$ | $\checkmark$ |

---

## 3. Spesifikasi Fungsional & Aturan Bisnis (Acceptance Criteria)

### M1 — Autentikasi & Profil
* **cakupan:** Registrasi (`name`, `email`, `password` min. 8 karakter), Login, Refresh Token, Logout, dan Get Profile (`/auth/me`).
* **Teknis Auth:** Menggunakan **HTTP-Only Cookie** (`access_token` 15 menit & `refresh_token` 7 hari).
* **Aturan Bisnis:** Email bersifat *case-insensitive* dan unik.

### M2 — Katalog & Manajemen Event
* **Atribut Event:** `name`, `short_description`, `poster_url` (upload file lokal maks. 5MB atau fallback URL), `location`, `start_time`, `end_time`, `status` (`UPCOMING` | `ONGOING` | `FINISHED`), `quota_total`, `quota_filled`.
* **Fitur Katalog:** Pencarian nama event, filter berdasarkan `status`, filter `managed_by_me` (event yang dikelola user), dan *pagination*.
* **Aturan Bisnis:**
  * Pembuat event otomatis menjadi `COORDINATOR` pertama dan status awal event adalah `UPCOMING`.
  * `end_time` wajib lebih besar dari `start_time`.
  * Koordinator dapat mengubah `quota_total`, namun nilainya **tidak boleh lebih kecil** dari jumlah pendaftaran aktif saat ini (`REGISTERED` + `CHECKED_IN`).

### M3 — Manajemen Kepanitiaan & Undangan
* **Alur Undangan:** Koordinator mengundang akun terdaftar via `email` dengan pilihan role `COORDINATOR` atau `COMMITTEE`. Calon panitia dapat melakukan `Accept` atau `Reject` melalui halaman Undangan Masuk.
* **Aturan Bisnis:**
  * Hanya akun yang sudah terdaftar di aplikasi yang dapat diundang.
  * **Guardrail Koordinator Terakhir:** Setiap event wajib memiliki minimal 1 `COORDINATOR` aktif. Koordinator terakhir ditolak sistem (`409 LAST_COORDINATOR`) jika mencoba keluar mandiri atau menurunkan *role*-nya sendiri sebelum menunjuk Koordinator lain.
  * Saat panitia keluar atau dikeluarkan, akses ke *endpoint* internal dan koneksi WebSocket internal (`/committee`) langsung diputus seketika.

### M4 — Rundown & Status Sesi
* **Atribut Sesi:** `title`, `description`, `speaker`, `location`, `start_time`, `end_time`, `status` (`UPCOMING` | `ONGOING` | `FINISHED`).
* **Aturan Bisnis:**
  * Daftar sesi selalu ditampilkan berurutan berdasarkan `start_time ASC`.
  * Status sesi tidak dapat dijalankan/diubah apabila status Event induk sudah `FINISHED`.
  * Perubahan status sesi langsung disiarkan via WebSocket ke seluruh pengguna yang membuka halaman event.

### M5 — Pendaftaran Peserta & Penjagaan Kuota
* **Status Pendaftaran:** `REGISTERED` $\rightarrow$ `CHECKED_IN` atau `CANCELLED`. Setiap pendaftaran aktif memiliki `qr_token` unik.
* **Aturan Bisnis:**
  * Pendaftaran hanya diizinkan saat status event `UPCOMING` dan `quota_available > 0`.
  * **Zero Overbooking (Race-Condition Safe):** Eksekusi pendaftaran wajib menggunakan transaksi database dengan *row-level locking* (`SELECT ... FOR UPDATE` pada baris event).
  * **Pembatalan:** Peserta (atau Koordinator) hanya dapat membatalkan pendaftaran jika status event masih `UPCOMING` dan peserta belum `CHECKED_IN`. Pembatalan mengubah status menjadi `CANCELLED` dan mengembalikan 1 kuota tersedia.
  * **Daftar Ulang:** Peserta yang berstatus `CANCELLED` dapat mendaftar kembali di event yang sama selama kuota masih tersedia dan event masih `UPCOMING` (mengaktifkan kembali baris registrasi yang ada).

### M6 — Operasional Meja Check-in
* **Metode Check-in:** Manual (klik tombol pada tabel peserta) dan Scan QR Code (`qr_token`).
* **Aturan Bisnis:**
  * Hanya dapat dilakukan oleh `COORDINATOR` atau `COMMITTEE` aktif ketika event berstatus `UPCOMING` atau `ONGOING`.
  * **Anti-Duplikasi (Idempotency Guard):** Peserta yang sudah berstatus `CHECKED_IN` tidak dapat di-*check-in* ulang (mengembalikan `409 ALREADY_CHECKED_IN` beserta waktu *check-in* sebelumnya).
  * Peserta berstatus `CANCELLED` ditolak saat mencoba *check-in*.

### M7 — Pengumuman, Dashboard Operasional, & Daftar Peserta
* **Pengumuman:** CRUD pengumuman (`title`, `content`) oleh Panitia/Koordinator, diurutkan dari yang terbaru (`created_at DESC`), dan muncul secara *realtime* di layar peserta.
* **Dashboard Statistik Kehadiran:** Menampilkan metrik *realtime*:
  * $\text{Pendaftar Aktif} = \text{REGISTERED} + \text{CHECKED\_IN}$
  * $\text{Sudah Hadir} = \text{CHECKED\_IN}$
  * $\text{Belum Hadir} = \text{REGISTERED}$
  * $\text{Dibatalkan} = \text{CANCELLED}$
  * $\text{Sisa Kuota} = \text{Quota Total} - \text{Pendaftar Aktif}$
  * Ringkasan jumlah sesi (`Total`, `Upcoming`, `Ongoing`, `Finished`).
* **Tabel Peserta & Ekspor CSV:** Mendukung *pagination*, pencarian (`name`/`email`), filter `status`, serta fitur *export* data tabel peserta ke format `.csv` di sisi Frontend.

---

## 4. Spesifikasi Realtime (WebSocket) & Animasi UI

### A. Pemisahan Saluran WebSocket
1. **Public Stream (`/ws/v1/events/:eventId/public`):**
   * Diakses oleh seluruh pengguna yang membuka detail event.
   * Menyiarkan perubahan info/status event, sisa kuota (`QUOTA_UPDATED`), perubahan rundown/status sesi (`SESSION_*`), pengumuman (`ANNOUNCEMENT_*`), dan notifikasi perubahan status registrasi milik pengguna terkait (`REGISTRATION_UPDATED` tanpa mengekspos data pribadi peserta lain).
2. **Committee Stream (`/ws/v1/events/:eventId/committee`):**
   * Hanya dapat diakses oleh `COORDINATOR` dan `COMMITTEE` aktif pada event tersebut.
   * Menyiarkan pembaruan angka *dashboard* (`DASHBOARD_UPDATED`), baris pendaftar baru/batal/check-in (`PARTICIPANT_*`), perubahan role, serta sinyal pencabutan akses (`ACCESS_REVOKED`).

### B. Kebutuhan Animasi Frontend
* Transisi halus saat perpindahan halaman/tab.
* Efek *highlight* / transisi visual saat terjadi pembaruan *realtime* (misal: badge status sesi berubah menjadi *Ongoing*, angka kehadiran bertambah, atau pengumuman baru masuk di urutan teratas).
* Animasi buka/tutup pada komponen Modal, Drawer, dan Toast.
* **Aksesibilitas:** Wajib menghormati pengaturan `prefers-reduced-motion: reduce` pada perangkat pengguna.

---

## 5. Arsitektur Teknis, Caching, & Infrastruktur

* **Stack Utama:** Next.js (App Router, TypeScript, Tailwind CSS) & Go Fiber (PostgreSQL, Redis, Native WebSocket `gofiber/contrib/websocket`).
* **Strategi Caching (Redis):**
  * Diterapkan pada endpoint `GET /api/v1/events` (katalog publik) dengan TTL 60 detik.
  * *Cache Invalidation* dijalankan otomatis saat ada pembuatan/perubahan/penghapusan event serta saat terjadi pendaftaran atau pembatalan peserta.
* **Deployment & DevOps (Global Technical Requirement):**
  * **Single VM:** Seluruh layanan (FE, BE, PostgreSQL, Redis, Reverse Proxy, dan Monitoring Stack) berjalan di dalam kontainer Docker pada satu VM yang sama.
  * **CI/CD Terpisah:** *Pipeline* otomatis dan mandiri untuk repositori Frontend dan Backend.
  * **Testing & Observability:** Pengujian otomatis pada alur krusial (terutama *concurrency* kuota dan *check-in*), *structured logging*, serta *monitoring health/metrics* layanan.

---

## 6. Batasan Cakupan (Out of Scope / Won't Have)
Agar tim tetap fokus menyelesaikan MVP dalam 12 jam, fitur berikut **tidak dikerjakan**:
1. Sistem pembayaran atau tiket berbayar.
2. Kuota terpisah per sesi *rundown*.
3. Sistem *waiting list* (daftar tunggu otomatis).
4. Fitur *live chat* atau komentar dua arah.
5. Pembuatan sertifikat otomatis, *bookmark* sesi pribadi, dan pengiriman email konfirmasi eksternal (SMTP).
