# BCC EventOps — Backend (Go Fiber + PostgreSQL)

Backend API untuk BCC EventOps. Tahap ini mencakup **setup project, struktur folder, migration, dan seeder** (belum termasuk handler/service per modul).

## Stack

- **Go 1.24+** & **Go Fiber v2**
- **PostgreSQL** via **GORM**
- **golang-migrate** untuk migration (SQL files)
- **bcrypt** untuk hash password, **UUID v4** untuk ID


## Persiapan

```bash
cd be
cp .env.example .env
# sesuaikan DB_HOST / DB_USER / DB_PASSWORD / DB_NAME

# install dependency
go mod tidy
```

Buat database (jika belum ada):

```bash
createdb bcc_eventops
# atau: psql -c "CREATE DATABASE bcc_eventops;"
```

## Migration

```bash
go run ./cmd/migrate up       # terapkan semua migration
go run ./cmd/migrate version  # cek versi
go run ./cmd/migrate down     # rollback semua
```

## Seeder

```bash
go run ./seeder
```

Akun contoh (password: `password123`):

| Email | Peran |
| :--- | :--- |
| rafi@bcc.id | Koordinator event |
| arun@bcc.id | Panitia (COMMITTEE) |
| mikael@bcc.id | Peserta |
| rizky@bcc.id | Peserta + undangan panitia pending |

## Menjalankan Server

```bash
go run ./cmd/api
```

- Health check: `GET http://localhost:8080/health`
- Base API: `http://localhost:8080/api/v1`
