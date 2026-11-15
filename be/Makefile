.PHONY: tidy run build swagger tools migrate-up migrate-down migrate-version seed

SWAG ?= $(shell go env GOPATH)/bin/swag

tidy:
	go mod tidy

run:
	go run ./cmd/api

build:
	go build ./...

tools:
	go install github.com/swaggo/swag/cmd/swag@v1.16.4

swagger:
	@test -x "$(SWAG)" || { echo "swag tidak ditemukan, menjalankan 'make tools'..."; $(MAKE) tools; }
	$(SWAG) init -g cmd/api/doc.go -o docs --parseDependency --parseInternal

migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-version:
	go run ./cmd/migrate version

seed:
	go run ./seeder
