package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/bcc/eventops-be/docs"
	"github.com/bcc/eventops-be/internal/bootstrap"
)

func main() {
	app, cfg, err := bootstrap.New()
	if err != nil {
		log.Fatalf("gagal inisialisasi aplikasi: %v", err)
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-quit
		log.Println("mematikan server...")
		_ = app.Shutdown()
	}()

	addr := ":" + cfg.App.Port
	log.Printf("%s berjalan di http://localhost%s (env=%s)", cfg.App.Name, addr, cfg.App.Env)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("server berhenti: %v", err)
	}
}

