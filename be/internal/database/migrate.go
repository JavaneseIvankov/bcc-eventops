package database

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/bcc/eventops-be/internal/config"
)

func runMigrateCLI(cfg *config.DatabaseConfig, dir, action string) error {
	if _, err := exec.LookPath("migrate"); err != nil {
		return fmt.Errorf("binary 'migrate' tidak ditemukan di PATH (install: brew install golang-migrate)")
	}

	if _, err := os.Stat(dir); err != nil {
		return fmt.Errorf("folder migration tidak ditemukan: %s", dir)
	}

	cmd := exec.Command("migrate", "-path", dir, "-database", cfg.MigrationURL(), action)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("migrate %s gagal: %w", action, err)
	}
	return nil
}

func RunMigrations(cfg *config.DatabaseConfig, dir string) error {
	return runMigrateCLI(cfg, dir, "up")
}

func RollbackMigrations(cfg *config.DatabaseConfig, dir string) error {
	return runMigrateCLI(cfg, dir, "down")
}

func Version(cfg *config.DatabaseConfig, dir string) error {
	return runMigrateCLI(cfg, dir, "version")
}
