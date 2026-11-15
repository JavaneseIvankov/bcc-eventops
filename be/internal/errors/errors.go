package apperr

import "net/http"

type AppError struct {
	Status  int
	Code    string
	Message string
	Data    any
}

func (e *AppError) Error() string { return e.Message }

func New(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

func NewWithData(status int, code, message string, data any) *AppError {
	return &AppError{Status: status, Code: code, Message: message, Data: data}
}

var (
	ErrUnauthorized  = New(http.StatusUnauthorized, "UNAUTHORIZED", "Autentikasi diperlukan.")
	ErrForbidden     = New(http.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki akses untuk aksi ini.")
	ErrNotFound      = New(http.StatusNotFound, "NOT_FOUND", "Data tidak ditemukan.")
	ErrInvalidInput  = New(http.StatusBadRequest, "INVALID_INPUT", "Data yang dikirim tidak valid.")
	ErrInternal      = New(http.StatusInternalServerError, "INTERNAL_ERROR", "Terjadi kesalahan pada server.")
	ErrEmailExists   = New(http.StatusConflict, "EMAIL_ALREADY_EXISTS", "Email sudah terdaftar.")
	ErrInvalidCreds  = New(http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau password salah.")
	ErrInvalidState  = New(http.StatusBadRequest, "INVALID_STATE", "Event sudah berstatus FINISHED, sesi tidak dapat diubah.")
	ErrQuotaExceeded     = New(http.StatusConflict, "QUOTA_EXCEEDED", "Kuota peserta untuk event ini sudah penuh.")
	ErrAlreadyRegistered = New(http.StatusConflict, "ALREADY_REGISTERED", "Anda sudah terdaftar aktif pada event ini.")
)
