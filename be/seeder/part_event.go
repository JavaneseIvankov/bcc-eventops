package main

import (
	"log"
	"time"

	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/utils"
	"gorm.io/gorm"
)

func seedSessions(db *gorm.DB, event models.Event) error {
	var count int64
	db.Model(&models.Session{}).Where("event_id = ?", event.ID).Count(&count)
	if count > 0 {
		return nil
	}

	sessions := []models.Session{
		{
			EventID: event.ID, Title: "Workshop Web BCC 2026",
			Description: strPtr("Pameran karya seni dari mahasiswa UB."),
			Speaker:     "Kak Joko", Location: "Gedung Widyaloka",
			StartTime: event.StartTime, EndTime: event.StartTime.Add(90 * time.Minute),
			Status: models.SessionStatusUpcoming,
		},
		{
			EventID: event.ID, Title: "Hands-on Go Fiber + PostgreSQL",
			Description: strPtr("Praktik membangun REST API."),
			Speaker:     "Kak Beni", Location: "Ruang F2.1",
			StartTime: event.StartTime.Add(90 * time.Minute),
			EndTime:   event.StartTime.Add(4 * time.Hour),
			Status:    models.SessionStatusUpcoming,
		},
	}
	if err := db.Create(&sessions).Error; err != nil {
		return err
	}
	log.Printf("seeder: %d session dibuat", len(sessions))
	return nil
}

func seedRegistrations(db *gorm.DB, event models.Event, userMap map[string]models.User) error {
	participants := []string{"mikael@bcc.id", "rizky@bcc.id"}
	for _, email := range participants {
		u := userMap[email]
		var count int64
		db.Model(&models.Registration{}).
			Where("event_id = ? AND user_id = ?", event.ID, u.ID).Count(&count)
		if count > 0 {
			continue
		}

		reg := models.Registration{
			EventID:      event.ID,
			UserID:       u.ID,
			Status:       models.RegistrationRegistered,
			QRToken:      utils.GenerateQRToken(),
			RegisteredAt: utils.NowUTC(),
		}
		if err := db.Create(&reg).Error; err != nil {
			return err
		}

		if err := db.Model(&models.Event{}).Where("id = ?", event.ID).
			UpdateColumn("quota_filled", gorm.Expr("quota_filled + 1")).Error; err != nil {
			return err
		}
		log.Printf("seeder: registrasi %s", email)
	}
	return nil
}

func seedAnnouncements(db *gorm.DB, event models.Event, userMap map[string]models.User) error {
	arun := userMap["arun@bcc.id"]
	var count int64
	db.Model(&models.Announcement{}).Where("event_id = ?", event.ID).Count(&count)
	if count > 0 {
		return nil
	}

	ann := models.Announcement{
		EventID:  event.ID,
		AuthorID: arun.ID,
		Title:    "Selamat Datang!",
		Content:  "Pastikan sudah menyiapkan laptop dan environment Go & Node.js sebelum acara dimulai.",
	}
	if err := db.Create(&ann).Error; err != nil {
		return err
	}
	log.Println("seeder: announcement dibuat")
	return nil
}

func seedInvitations(db *gorm.DB, event models.Event, userMap map[string]models.User) error {
	coordinator := userMap["rafi@bcc.id"]
	rizky := userMap["rizky@bcc.id"]

	var count int64
	db.Model(&models.Invitation{}).
		Where("event_id = ? AND invitee_user_id = ?", event.ID, rizky.ID).Count(&count)
	if count > 0 {
		return nil
	}

	inv := models.Invitation{
		EventID:       event.ID,
		InviterUserID: coordinator.ID,
		InviteeUserID: rizky.ID,
		Role:          models.RoleCommittee,
		Status:        models.InvitationPending,
	}
	if err := db.Create(&inv).Error; err != nil {
		return err
	}
	log.Println("seeder: invitation pending dibuat")
	return nil
}
