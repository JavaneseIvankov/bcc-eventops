package main

import (
	"log"
	"time"

	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/utils"
	"gorm.io/gorm"
)

func seedUsers(db *gorm.DB) (map[string]models.User, error) {
	users := []struct {
		Name  string
		Email string
		Pass  string
	}{
		{"Rafi Rahman", "rafi@bcc.id", "password123"},
		{"Priyambodo Arundaya", "arun@bcc.id", "password123"},
		{"Mikael", "mikael@bcc.id", "password123"},
		{"Rizky Pratama", "rizky@bcc.id", "password123"},
	}

	userMap := make(map[string]models.User)
	for _, u := range users {
		var existing models.User
		err := db.Where("lower(email) = ?", u.Email).First(&existing).Error
		if err == nil {
			userMap[u.Email] = existing
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return nil, err
		}

		hash, err := utils.HashPassword(u.Pass)
		if err != nil {
			return nil, err
		}
		user := models.User{Name: u.Name, Email: u.Email, PasswordHash: hash}
		if err := db.Create(&user).Error; err != nil {
			return nil, err
		}
		userMap[u.Email] = user
		log.Printf("seeder: user dibuat -> %s", u.Email)
	}
	return userMap, nil
}

func seedEvent(db *gorm.DB, userMap map[string]models.User) (models.Event, error) {
	coordinator := userMap["rafi@bcc.id"]

	var event models.Event
	err := db.Where("name = ?", "Workshop Web BCC 2026").First(&event).Error
	if err == nil {
		return event, nil
	}
	if err != gorm.ErrRecordNotFound {
		return event, err
	}

	start := utils.NowUTC().Add(72 * time.Hour)
	event = models.Event{
		Name:             "Workshop Web BCC 2026",
		ShortDescription: "Belajar Go Fiber dan Next.js dari dasar hingga deployment.",
		PosterURL:        strPtr("https://api.eventops.bcc.id/uploads/posters/web-bcc.webp"),
		Location:         "Gedung F Filkom UB, Ruang F2.1",
		StartTime:        start,
		EndTime:          start.Add(6 * time.Hour),
		Status:           models.EventStatusUpcoming,
		QuotaTotal:       50,
		QuotaFilled:      0,
		CreatedBy:        coordinator.ID,
	}
	if err := db.Create(&event).Error; err != nil {
		return event, err
	}
	log.Printf("seeder: event dibuat -> %s", event.Name)
	return event, nil
}

func seedCommittees(db *gorm.DB, event models.Event, userMap map[string]models.User) error {
	committees := []struct {
		Email string
		Role  string
	}{
		{"rafi@bcc.id", models.RoleCoordinator},
		{"arun@bcc.id", models.RoleCommittee},
	}
	for _, cm := range committees {
		u := userMap[cm.Email]
		var count int64
		db.Model(&models.CommitteeMember{}).
			Where("event_id = ? AND user_id = ?", event.ID, u.ID).Count(&count)
		if count > 0 {
			continue
		}
		member := models.CommitteeMember{EventID: event.ID, UserID: u.ID, Role: cm.Role}
		if err := db.Create(&member).Error; err != nil {
			return err
		}
		log.Printf("seeder: committee %s -> %s", cm.Email, cm.Role)
	}
	return nil
}
