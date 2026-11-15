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
- Swagger UI: `http://localhost:8080/swagger/index.html`

## Swagger

Dokumentasi memakai **swaggo/swag** + **gofiber/swagger**.

Anotasi umum ada di `cmd/api/doc.go`. Anotasi per-endpoint nantinya ditulis di atas
masing-masing handler, contoh:

```go
// Login godoc
// @Summary Login pengguna
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body dto.LoginRequest true "Kredensial"
// @Success 200 {object} response.SuccessResponse
// @Failure 401 {object} response.ErrorResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error { ... }
```

Regenerate dokumen setiap kali anotasi berubah:

```bash
make swagger
# atau
swag init -g cmd/api/doc.go -o docs --parseDependency --parseInternal
```

> Pastikan `swag` terpasang: `go install github.com/swaggo/swag/cmd/swag@v1.16.4`

Hasil generate: `docs/docs.go`, `docs/swagger.json`, `docs/swagger.yaml`.

