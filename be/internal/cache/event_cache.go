package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/bcc/eventops-be/internal/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	eventCacheTTL       = 60 * time.Second
	eventListVersionKey = "events:list:version"
)

type EventListResult struct {
	Events []models.Event `json:"events"`
	Total  int64          `json:"total"`
}

type EventCache struct {
	rdb *redis.Client
}

func NewEventCache(rdb *redis.Client) *EventCache {
	return &EventCache{rdb: rdb}
}

func (c *EventCache) listKey(page, limit int, search, status string, managedByMe bool, userID uuid.UUID) string {
	version, _ := c.rdb.Get(context.Background(), eventListVersionKey).Int64()
	return fmt.Sprintf("events:list:v%d:%d:%d:%s:%s:%t:%s", version, page, limit, search, status, managedByMe, userID)
}

func (c *EventCache) GetList(ctx context.Context, page, limit int, search, status string, managedByMe bool, userID uuid.UUID) (*EventListResult, bool) {
	val, err := c.rdb.Get(ctx, c.listKey(page, limit, search, status, managedByMe, userID)).Bytes()
	if err != nil {
		return nil, false
	}

	var result EventListResult
	if err := json.Unmarshal(val, &result); err != nil {
		return nil, false
	}
	return &result, true
}

func (c *EventCache) SetList(ctx context.Context, page, limit int, search, status string, managedByMe bool, userID uuid.UUID, result EventListResult) {
	data, err := json.Marshal(result)
	if err != nil {
		return
	}
	key := c.listKey(page, limit, search, status, managedByMe, userID)
	_ = c.rdb.Set(ctx, key, data, eventCacheTTL).Err()
}

func (c *EventCache) InvalidateList(ctx context.Context) {
	_ = c.rdb.Incr(ctx, eventListVersionKey).Err()
}

func (c *EventCache) detailKey(eventID uuid.UUID) string {
	return "events:detail:" + eventID.String()
}

func (c *EventCache) GetDetail(ctx context.Context, eventID uuid.UUID) (*models.Event, bool) {
	val, err := c.rdb.Get(ctx, c.detailKey(eventID)).Bytes()
	if err != nil {
		return nil, false
	}

	var event models.Event
	if err := json.Unmarshal(val, &event); err != nil {
		return nil, false
	}
	return &event, true
}

func (c *EventCache) SetDetail(ctx context.Context, event *models.Event) {
	data, err := json.Marshal(event)
	if err != nil {
		return
	}
	_ = c.rdb.Set(ctx, c.detailKey(event.ID), data, eventCacheTTL).Err()
}

func (c *EventCache) InvalidateDetail(ctx context.Context, eventID uuid.UUID) {
	_ = c.rdb.Del(ctx, c.detailKey(eventID)).Err()
}
