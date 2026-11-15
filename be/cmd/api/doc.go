package main

// @title BCC EventOps API
// @version 1.0.0
// @description Spesifikasi REST API untuk BCC EventOps. Auth menggunakan Bearer Token (access_token & refresh_token dikembalikan lewat response body). Konvensi JSON snake_case, ID UUID v4, waktu ISO 8601.
// @termsOfService http://swagger.io/terms/

// @contact.name BCC EventOps Team
// @contact.email dev@bcc.id

// @host localhost:8080
// @BasePath /api/v1
// @schemes http https

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Masukkan token dengan format: Bearer {access_token}
