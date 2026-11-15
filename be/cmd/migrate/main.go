package migrate

import (
	"flag"
	"log"
	"os"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/bcc/eventops-be/internal/database"
)

func main() {
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("gagal memuat konfigurasi: %v", err)
	}

	dir := cfg.App.MigrationsDir
	action := "up"
	if flag.NArg() > 0 {
		action = flag.Arg(0)
	}

	switch action {
	case "up":
		err = database.RunMigrations(&cfg.Database, dir)
	case "down":
		err = database.RollbackMigrations(&cfg.Database, dir)
	case "version":
		err = database.Version(&cfg.Database, dir)
	default:
		log.Fatalf("perintah tidak dikenal: %s (gunakan up|down|version)", action)
	}

	if err != nil {
		log.Fatalf("migration error: %v", err)
	}
	os.Exit(0)
}
