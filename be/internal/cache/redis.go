package cache

import (
	"context"
	"fmt"

	"github.com/bcc/eventops-be/internal/config"
	"github.com/redis/go-redis/v9"
)

func NewClient(cfg config.RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	err := client.Ping(context.Background()).Err()
	return client, err
}
