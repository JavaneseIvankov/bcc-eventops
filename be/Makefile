.PHONY: tidy run build swagger migrate-up migrate-down migrate-version seed

tidy:
	go mod tidy

run:
	go run ./cmd/api

build:
	go build ./...

swagger:
	swag init -g cmd/api/doc.go -o docs --parseDependency --parseInternal

migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-version:
	go run ./cmd/migrate version

seed:
	go run ./seeder
