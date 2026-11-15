# BCC EventOps (BCCin) — Frontend UI Architecture & AI Context Guide

> **Cara Pakai untuk Tim & AI Assistant:**
> Berikan file ini sebagai konteks utama ke AI Assistant (Cursor / Claude / ChatGPT / Gemini) sebelum meminta AI membuat atau mengedit halaman/komponen Frontend. Dokumen ini adalah _Single Source of Truth_ untuk struktur halaman, aturan komponen UI, dan pemetaan data `queries.ts` pada proyek **BCC EventOps**.

---

## 1. Prinsip Desain & Keputusan Arsitektur Utama

1. **Tidak Ada "Super Admin" Global:**
   Setiap akun yang login adalah `User` biasa. Peran (`my_role`: `"COORDINATOR"` | `"COMMITTEE"` | `null`) bersifat **spesifik per event**.
   - Di Event A, user bisa menjadi **Peserta** (`my_role: null`).
   - Di Event B, user bisa menjadi **Panitia** (`my_role: "COMMITTEE"`).
   - Saat user membuat Event C, ia otomatis menjadi **Koordinator** (`my_role: "COORDINATOR"`).

2. **Satu App Shell Global (`(main)/layout.tsx`):**
   - Seluruh halaman setelah login menggunakan **Top Navbar Global** (`max-w-7xl mx-auto`), **bukan** Admin Sidebar global.
   - Top Navbar memuat: Brand **BCCin**, menu **Dashboard** (`/dashboard` + badge jumlah undangan `PENDING`), menu **Explore Events** (`/events`), tombol **`+ Create event`** (`/events/new`), dan **User Profile Dropdown** (`useGetMe` + `useLogout`).

3. **User Dashboard (`/dashboard`) sebagai Personal Hub (1 Screen Terpadu):**
   - Menggabungkan: **Ringkasan KPI Pribadi**, **Kotak Masuk Undangan Panitia (`PENDING`)** (bisa langsung klik _Accept / Reject_ di tempat tanpa pindah halaman), **My Managed Events** (klik mengarah ke _Event Workspace_), **My Registered Tickets** (lihat QR Code & batal daftar), serta **User Profile**.

4. **Event Operations Workspace (`/events/[eventId]/workspace`) Berbasis Tab Horizontal:**
   - **Tidak menggunakan sidebar kiri.** Seluruh fitur operasional panitia & koordinator untuk satu event spesifik diorganisasikan menggunakan komponen **Horizontal Tabs (`shadcn/ui Tabs`)** yang disinkronkan dengan query URL `?tab=...`.

---

## 2. Aturan Coding & Konvensi UI (WAJIB DIIKUTI AI)

1. **Prioritaskan `shadcn/ui` Primitives:**
   Gunakan komponen dari `@/shared/components/ui/*` (`Card`, `Badge`, `Button`, `buttonVariants`, `Input`, `Progress`, `Select`, `Table`, `Tabs`, `DropdownMenu`, `AlertDialog`, `Dialog`, `Skeleton`). Jangan membuat komponen dasar dari nol jika sudah ada di `shadcn/ui`.
2. **DILARANG Menggunakan Prop `asChild` pada `Button` atau `DropdownMenuTrigger`:**
   > **Catatan penting:** UI kit di proyek ini memakai `@base-ui/react`, **bukan Radix**. `asChild` memang tidak tersedia di sini; primitive Base UI memakai prop `render`. Untuk trigger yang butuh styling tombol, pakai `className={cn(buttonVariants(...))}` langsung pada `XTrigger` (sudah mendukung `className`), bukan `asChild`.
   - **Jangan tulis:** `<Button asChild><Link href="/events">...</Link></Button>`
   - **Gunakan `buttonVariants` langsung pada `<Link>` atau Trigger:**
     ```tsx
     import Link from "next/link"
     import { cn } from "@/lib/utils"
     import { buttonVariants } from "@/shared/components/ui/button"

     ;<Link
       href="/events/new"
       className={cn(buttonVariants({ variant: "default", size: "sm" }))}
     >
       Create Event
     </Link>
     ```
3. **Pecah Menjadi Komponen Kecil yang Composable:**
   - Dalam satu halaman (`page.tsx`), pecah UI menjadi sub-komponen logis yang kecil dan _composable_ (misal: `WorkspaceHeader`, `OverviewTab`, `CheckInTab`, `ParticipantsTab`, dll.) baik di dalam file yang sama maupun di bawah `src/features/<nama-fitur>/components/`.
4. **Data Fetching & Mutasi Wajib Lewat `@/shared/repository/queries`:**
   - Jangan pernah memanggil `fetch()` manual di dalam komponen UI.
   - Selalu gunakan custom hooks TanStack Query dari `@/shared/repository/queries` dan tipe data dari `@/shared/repository/types`.
5. **Boundary Typing untuk Nilai Enum (WAJIB):**
   Nilai dari `Select`/trigger pihak ketiga bisa berupa `null`. **Jangan** pakai `as` cast di situ. Narrow dulu di boundary, lalu masuk ke state:
   ```tsx
   const handleStatusChange = (value: EventStatus | "ALL" | null) => {
     if (!value) return
     setStatusFilter(value)
   }
   ```
   Untuk daftar status/tab, definisikan sekali sebagai `as const` lalu turunkan tipenya, supaya tidak ada union yang melebar jadi `string`.

6. **Visualisasi Status & Warna Konsisten:**
   - `ONGOING`: Badge `variant="default"` dengan dot hijau berkedip (`bg-emerald-500 animate-pulse`).
   - `UPCOMING`: Badge `variant="secondary"` dengan dot biru (`bg-blue-500`).
   - `FINISHED`: Badge `variant="outline"` dengan dot abu-abu (`bg-muted-foreground`).

---

## 3. Struktur Folder & Peta Route (Total 7 Rute)

```text
src/
├── app/
│   ├── (auth)/                              # Layout: Centered Card (Guest Only)
│   │   ├── login/page.tsx                   # 1. Login Screen
│   │   └── register/page.tsx                # 2. Register Screen
│   │
│   └── (main)/                              # Layout: Global Top Navbar (Auth Guarded via useGetMe)
│       ├── layout.tsx                       # Unified Top Navbar Shell (BCCin)
│       ├── dashboard/
│       │   └── page.tsx                     # 3. User Dashboard (Overview, Invites, Managed Events, My Tickets, Profile)
│       └── events/
│           ├── page.tsx                     # 4. Explore Event Catalog (Search, Filter Status, Managed Toggle)
│           ├── new/
│           │   └── page.tsx                 # 5. Create New Event (+ Upload Poster)
│           └── [eventId]/
│               ├── page.tsx                 # 6. Public Event Detail & Live Hub (Register, QR Ticket, Live Rundown & Announcements)
│               └── workspace/
│                   └── page.tsx             # 7. Tab-Based Event Operations Workspace (Coordinator & Committee Only)
│
└── shared/
    ├── components/ui/                       # Komponen shadcn/ui
    └── repository/
        ├── types.ts                         # Semua TypeScript Interfaces & Enums
        ├── actions.ts                       # "use server" fetcher (@better-fetch + Cookie Forwarding)
        ├── queries.ts                       # "use client" TanStack Query Hooks (31 endpoints)
        └── websocket.ts                     # Custom Hook WebSocket (/public & /committee)
```

---

## 4. Spesifikasi Detail Per Layar & Pemetaan Hooks

### Rute 1 & 2: `/login` & `/register`

- **Akses:** Publik (Redirect ke `/dashboard` setelah sukses).
- **Hooks:** `useLogin()`, `useRegister()`.
- **UI & Error Handling:** Validasi input form (password min 8 karakter). Tangani error `401 UNAUTHORIZED` saat login dan `409 EMAIL_ALREADY_EXISTS` saat registrasi.

---

### Rute 3: `/dashboard` — Personal User Dashboard (1 Screen)

- **Akses:** Semua User Login.
- **Hooks:**
  - `useGetMe()` (Info profil user)
  - `useGetMyInvitations({ status: "PENDING" })`, `useAcceptInvitation()`, `useRejectInvitation()`
  - `useGetEvents({ managed_by_me: true, limit: 100 })`, `useDeleteEvent()`
  - `useGetMyRegistrations()`, `useCancelMyRegistration()`
- **Susunan Komponen di Layar:**
  1. **Header & User Profile Summary:** Nama, email, tombol `+ Create event` (`/events/new`).
  2. **4 KPI Ringkasan:** _Managed Events_ (jumlah jadi Coordinator vs Committee), _Active Registrations_, _Upcoming & Live Events_, _My Registered Tickets_.
  3. **Inline Pending Invitations Section:** Muncul jika ada undangan panitia berstatus `PENDING`. Dilengkapi tombol **Accept** & **Reject** langsung di kartu tersebut.
  4. **Tabs atau 2 Section "My Events":**
     - **Tab 1 — Managed Events (Panitia/Koordinator):** Tabel daftar event yang dikelola user. Klik nama event atau tombol **"Open Workspace"** mengarahkan user ke `/events/[eventId]/workspace`.
     - **Tab 2 — My Tickets / Registrations (Peserta):** Daftar event yang diikuti user sebagai peserta. Dilengkapi tombol **"Show QR Code"** (membuka Modal berisi QR dari `qr_token`), status (`REGISTERED` / `CHECKED_IN` / `CANCELLED`), dan tombol **"Cancel Registration"** (aktif jika status event masih `UPCOMING`).

---

### Rute 4: `/events` — Explore Event Catalog _(Sudah Selesai)_

- **Akses:** Semua User Login.
- **Hooks:** `useGetEvents({ page, limit: 9, search, status, managed_by_me })`.
- **Perilaku UI:**
  - Pencarian _debounced_ (350ms), filter `Select` status (`ALL`, `ONGOING`, `UPCOMING`, `FINISHED`), dan tombol toggle `Managed by me`.
  - Setiap kartu menampilkan poster, status badge, badge role (`Coordinator` / `Committee` jika `my_role !== null`), waktu, lokasi, dan progress bar kuota (`quota_filled / quota_total`).
  - Tombol utama kartu mengarah ke `/events/[eventId]`, ditambah tombol pintas **"Workspace"** (`/events/[eventId]/workspace`) jika `event.my_role !== null`.

---

### Rute 5: `/events/new` — Create Event

- **Akses:** Semua User Login (Pembuat otomatis menjadi `COORDINATOR`).
- **Hooks:** `useUploadFile()`, `useCreateEvent()`.
- **Alur Submit:**
  1. Jika user memilih file gambar poster (`.jpg`, `.png`, `.webp` maks 5MB), panggil `useUploadFile()` terlebih dahulu untuk mendapatkan `data.url`.
  2. Kirim payload `{ name, short_description, poster_url, location, start_time, end_time, quota_total }` ke `useCreateEvent()`.
  3. Setelah sukses (`201 Created`), redirect langsung ke `/events/${newEvent.id}/workspace`.

---

### Rute 6: `/events/[eventId]` — Public Event Detail & Live Hub (Peserta)

- **Akses:** Semua User Login.
- **Hooks:**
  - `useGetEventDetail(eventId)`
  - `useGetEventSessions(eventId)`
  - `useGetAnnouncements(eventId)`
  - `useRegisterEvent()`, `useCancelMyRegistration()`
- **WebSocket:** Buka koneksi ke `ws://<host>/ws/v1/events/${eventId}/public`.
- **Susunan Komponen:**
  - **Sticky Committee Bar (Conditional):** Jika `event.my_role === "COORDINATOR" | "COMMITTEE"`, tampilkan banner di bagian paling atas: _"Kamu adalah Koordinator/Panitia di event ini"_ dengan tombol **[Buka Event Workspace (`/events/[eventId]/workspace`)]** dan **[Meja Check-in (`/events/[eventId]/workspace?tab=check-in`)]**.
  - **Kolom Kiri (2/3 Lebar di Desktop):**
    - Hero Poster, Judul, Badge Status, Tanggal/Jam, Lokasi, dan Deskripsi.
    - **Sub-Tab 1: Live Rundown (`useGetEventSessions`):** Daftar sesi berurutan (`start_time ASC`). Sesi yang berstatus `ONGOING` diberi _border_ hijau menyala & badge `LIVE NOW`.
    - **Sub-Tab 2: Live Announcements (`useGetAnnouncements`):** Daftar pengumuman terbaru (`created_at DESC`).
  - **Kolom Kanan (1/3 Lebar — Sticky Registration & Ticket Card):**
    - Progress bar kuota (`quota_filled / quota_total`).
    - **State Machine Berdasarkan `event.my_registration`:**
      - `null` (Belum terdaftar): Tombol **"Daftar Sekarang"** (`useRegisterEvent`) aktif jika `event.status === "UPCOMING"` dan `quota_available > 0`.
      - `status === "REGISTERED"`: Tampilkan **QR Code Ticket (`qr_token`)** langsung di kartu (plus tombol perbesar ke Modal) dan tombol **"Batalkan Pendaftaran"** (`useCancelMyRegistration`, hanya jika event masih `UPCOMING`).
      - `status === "CHECKED_IN"`: Tampilkan badge hijau terverifikasi **"Checked In pada [checked_in_at]"** (otomatis berubah _realtime_ saat panitia men-scan QR peserta).
      - `status === "CANCELLED"`: Tampilkan status dibatalkan + tombol **"Daftar Ulang"** (`useRegisterEvent`) jika event masih `UPCOMING` dan kuota tersedia.

---

### Rute 7: `/events/[eventId]/workspace` — Tab-Based Event Operations Workspace

- **Akses:** Khusus `COORDINATOR` & `COMMITTEE` (`if (!isLoading && !event.my_role) router.replace('/events/' + eventId)`).
- **WebSocket:** Buka koneksi ke `ws://<host>/ws/v1/events/${eventId}/committee` dan `/public`. Jika menerima event `ACCESS_REVOKED`, tampilkan notifikasi dan langsung _redirect_ ke `/events/${eventId}`.
- **Struktur Layar:**
  1. **Workspace Header (Selalu Tampil di Atas):**
     - Baris atas: Link `← Back to Dashboard` (`/dashboard`) dan `View Public Page ↗` (`/events/[eventId]`).
     - Judul Event, Badge Status (`UPCOMING` / `ONGOING` / `FINISHED`), Badge Role (`COORDINATOR` / `COMMITTEE`), Waktu & Lokasi.
     - Quick Actions di Kanan: Dropdown ubah status event cepat (`useUpdateEvent` — khusus `COORDINATOR`) & tombol pintas ke tab `Check-in Desk`.
  2. **Horizontal Tabs (`?tab=overview | check-in | participants | rundown | announcements | committee | settings`):**

| Nama Tab              | `?tab=`         | Role Akses               | Isi Komponen & Hooks (`queries.ts`)                                                                                                                                                                                                                                                                                                                                                                       |
| :-------------------- | :-------------- | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Overview**       | `overview`      | Coordinator & Committee  | • **4 KPI Cards Realtime** (`useGetEventDashboard`): _Checked In_ (+ progress bar %), _Not Arrived_, _Cancelled_, _Quota Left_.<br>• **Rundown Summary:** Jumlah sesi _Ongoing_, _Upcoming_, _Finished_.                                                                                                                                                                                                  |
| **2. Check-in Desk**  | `check-in`      | Coordinator & Committee  | • **Kolom Kiri (QR Scanner):** Kamera QR scanner + input manual `qr_token` (`useCheckInQr`). Tampilkan hasil scan jelas: Hijau (`200 OK`), Kuning/Merah Peringatan Duplikat (`409 ALREADY_CHECKED_IN`), atau Merah (`400/404`).<br>• **Kolom Kanan (Manual Lookup):** Cari nama/email peserta (`useGetEventParticipants`) + tombol _One-Click Check-in_ (`useCheckInManual`).                             |
| **3. Participants**   | `participants`  | Coordinator & Committee  | • Tabel peserta (`useGetEventParticipants`) dengan Search Bar, Filter Status (`REGISTERED`, `CHECKED_IN`, `CANCELLED`), dan Pagination.<br>• Tombol **Export CSV** (ambil semua data `limit: 10000` lalu unduh `.csv` di browser).<br>• Aksi baris: Tombol **Check-in** (`useCheckInManual`) & **Cancel Registration** (`useCancelParticipantRegistration` — khusus `COORDINATOR` saat event `UPCOMING`). |
| **4. Rundown**        | `rundown`       | Coordinator & Committee  | • Daftar sesi (`useGetEventSessions`).<br>• **Quick Status Toggle** (`UPCOMING` → `ONGOING` → `FINISHED` via `useUpdateSessionStatus`) yang bisa diklik oleh Panitia maupun Koordinator.<br>• Tombol **`+ Add Session`** (`useCreateSession`), **Edit** (`useUpdateSession`), dan **Delete** (`useDeleteSession`) khusus `COORDINATOR`.                                                                   |
| **5. Announcements**  | `announcements` | Coordinator & Committee  | • Form broadcast pengumuman baru (`useCreateAnnouncement`).<br>• Daftar pengumuman (`useGetAnnouncements`) dengan aksi **Edit** (`useUpdateAnnouncement`) & **Delete** (`useDeleteAnnouncement`).                                                                                                                                                                                                         |
| **6. Committee Team** | `committee`     | Coordinator & Committee  | • Form undang panitia via email (`useInviteCommittee` — khusus `COORDINATOR`).<br>• Tabel panitia aktif (`useGetEventCommittees`): ubah role (`useUpdateCommitteeRole`), keluarkan anggota (`useRemoveCommitteeMember`), atau keluar mandiri (`useLeaveCommittee`).<br>• Tabel undangan `PENDING` (`useCancelInvitation`).                                                                                |
| **7. Settings**       | `settings`      | **Khusus `COORDINATOR`** | • Form edit detail event, kapasitas kuota (`quota_total` tidak boleh di bawah pendaftar aktif), & ganti poster (`useUploadFile` + `useUpdateEvent`).<br>• **Danger Zone:** Hapus event (`useDeleteEvent` dengan `AlertDialog`).                                                                                                                                                                           |

---

## 5. Kontrak Integrasi WebSocket (`websocket.ts`)

Saat berada di `/events/[eventId]` atau `/events/[eventId]/workspace`, setiap pesan JSON yang masuk dari WebSocket (`{ event: string, data: any }`) harus memicu `queryClient.invalidateQueries` pada `eventOpsKeys` yang relevan agar UI ter-update secara _realtime_ tanpa refresh:

- **Channel Publik (`/ws/v1/events/{eventId}/public`):**
  - `EVENT_UPDATED` / `QUOTA_UPDATED` $\rightarrow$ invalidate `eventOpsKeys.events.detail(eventId)` & `eventOpsKeys.events.lists()`
  - `SESSION_CREATED` / `SESSION_UPDATED` / `SESSION_STATUS_UPDATED` / `SESSION_DELETED` $\rightarrow$ invalidate `eventOpsKeys.events.sessions(eventId)` & `eventOpsKeys.events.dashboard(eventId)`
  - `ANNOUNCEMENT_CREATED` / `ANNOUNCEMENT_UPDATED` / `ANNOUNCEMENT_DELETED` $\rightarrow$ invalidate `eventOpsKeys.events.announcements(eventId)`
  - `REGISTRATION_UPDATED` $\rightarrow$ invalidate `eventOpsKeys.events.detail(eventId)` & `eventOpsKeys.registrations.mine()`

- **Channel Panitia (`/ws/v1/events/{eventId}/committee`):**
  - `DASHBOARD_UPDATED` $\rightarrow$ invalidate `eventOpsKeys.events.dashboard(eventId)`
  - `PARTICIPANT_REGISTERED` / `PARTICIPANT_CANCELLED` / `PARTICIPANT_CHECKED_IN` $\rightarrow$ invalidate `eventOpsKeys.events.participants(eventId)` & `eventOpsKeys.events.dashboard(eventId)`
  - `COMMITTEE_ROLE_CHANGED` $\rightarrow$ invalidate `eventOpsKeys.events.detail(eventId)` & `eventOpsKeys.events.committees(eventId)`
  - `ACCESS_REVOKED` $\rightarrow$ tutup koneksi socket, tampilkan notifikasi bahwa akses kepanitiaan dicabut, dan `router.replace('/events/' + eventId)`.

---

## 6. Pembagian Tugas Paralel (2 Frontend Engineers)

Agar tidak terjadi _merge conflict_, pembagian file antara **FE Dev 1** dan **FE Dev 2** adalah sebagai berikut:

- **FE Dev 1 (Dashboard, Event Creation, & Tab-Based Event Workspace):**
  - `src/app/(main)/layout.tsx` _(Selesai)_
  - `src/app/(main)/dashboard/page.tsx`
  - `src/app/(main)/events/new/page.tsx`
  - `src/app/(main)/events/[eventId]/workspace/page.tsx` (beserta sub-komponen 7 Tab)
- **FE Dev 2 (Auth, Public Catalog, Public Event Live Hub & Ticket QR, WebSocket Hook):**
  - `src/app/(auth)/login/page.tsx` & `register/page.tsx`
  - `src/app/(main)/events/page.tsx` _(Selesai)_
  - `src/app/(main)/events/[eventId]/page.tsx` (Public Landing, Pendaftaran, Modal QR Code, Live Rundown & Pengumuman)
  - `src/shared/repository/websocket.ts` (`useEventRealtime` hook)
