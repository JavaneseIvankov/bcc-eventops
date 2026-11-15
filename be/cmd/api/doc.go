package main

// @title BCC EventOps API
// @version 1.0.0
// @description Spesifikasi REST API untuk BCC EventOps. Auth menggunakan HTTP-Only Cookie (access_token & refresh_token). Konvensi JSON snake_case, ID UUID v4, waktu ISO 8601.
// @termsOfService http://swagger.io/terms/

// @contact.name BCC EventOps Team
// @contact.email dev@bcc.id

// @host localhost:8080
// @BasePath /api/v1
// @schemes http https

// @securityDefinitions.apikey cookieAuth
// @in cookie
// @name access_token
// @description HTTP-Only Cookie berisi JWT Access Token
