package main

import (
	"log"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/bcc/eventops-be/internal/database"
	"gorm.io/gorm"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("gagal memuat konfigurasi: %v", err)
	}

	db, err := database.NewPostgres(&cfg.Database)
	if err != nil {
		log.Fatalf("gagal koneksi database: %v", err)
	}
	defer database.Close(db)

	if err := seed(db); err != nil {
		log.Fatalf("seeder gagal: %v", err)
	}
	log.Println("seeder: selesai")
}

func strPtr(s string) *string { return &s }

func seed(db *gorm.DB) error {
	userMap, err := seedUsers(db)
	if err != nil {
		return err
	}

	event, err := seedEvent(db, userMap)
	if err != nil {
		return err
	}

	if err := seedCommittees(db, event, userMap); err != nil {
		return err
	}
	if err := seedSessions(db, event); err != nil {
		return err
	}
	if err := seedRegistrations(db, event, userMap); err != nil {
		return err
	}
	if err := seedAnnouncements(db, event, userMap); err != nil {
		return err
	}
	if err := seedInvitations(db, event, userMap); err != nil {
		return err
	}

	return nil
}
