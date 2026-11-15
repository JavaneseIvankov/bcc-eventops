package ws

import (
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
)

type Room string

const (
	RoomPublic    Room = "public"
	RoomCommittee Room = "committee"
)

type Client struct {
	Conn    *websocket.Conn
	UserID  uuid.UUID
	EventID uuid.UUID
	Room    Room

	writeMu sync.Mutex
}

func NewClient(conn *websocket.Conn, userID, eventID uuid.UUID, room Room) *Client {
	return &Client{Conn: conn, UserID: userID, EventID: eventID, Room: room}
}

func (c *Client) WriteJSON(v any) error {
	c.writeMu.Lock()
	defer c.writeMu.Unlock()
	return c.Conn.WriteJSON(v)
}

func (c *Client) Close() {
	_ = c.Conn.WriteControl(websocket.CloseMessage,
		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
		time.Now().Add(time.Second))
	_ = c.Conn.SetReadDeadline(time.Now())
	_ = c.Conn.Close()
}

type roomKey struct {
	EventID uuid.UUID
	Room    Room
}

type Hub struct {
	mu      sync.RWMutex
	clients map[roomKey]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{clients: make(map[roomKey]map[*Client]struct{})}
}

func (h *Hub) Register(client *Client) {
	key := roomKey{EventID: client.EventID, Room: client.Room}

	h.mu.Lock()
	defer h.mu.Unlock()
	if h.clients[key] == nil {
		h.clients[key] = make(map[*Client]struct{})
	}
	h.clients[key][client] = struct{}{}
}

func (h *Hub) Unregister(client *Client) {
	key := roomKey{EventID: client.EventID, Room: client.Room}

	h.mu.Lock()
	defer h.mu.Unlock()
	if clients, ok := h.clients[key]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.clients, key)
		}
	}
}

func (h *Hub) CloseUserConnections(eventID uuid.UUID, room Room, userID uuid.UUID, reason Message) {
	key := roomKey{EventID: eventID, Room: room}

	h.mu.Lock()
	defer h.mu.Unlock()

	clients, ok := h.clients[key]
	if !ok {
		return
	}
	for c := range clients {
		if c.UserID == userID {
			_ = c.WriteJSON(reason)
			c.Close()
			delete(clients, c)
		}
	}
	if len(clients) == 0 {
		delete(h.clients, key)
	}
}

func (h *Hub) Broadcast(eventID uuid.UUID, room Room, message Message) {
	key := roomKey{EventID: eventID, Room: room}

	h.mu.RLock()
	clients := make([]*Client, 0, len(h.clients[key]))
	for c := range h.clients[key] {
		clients = append(clients, c)
	}
	h.mu.RUnlock()

	for _, c := range clients {
		_ = c.WriteJSON(message)
	}
}
