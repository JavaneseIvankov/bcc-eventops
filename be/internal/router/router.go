package router

import (
	"encoding/json"
	"errors"
	"log"
	"strings"

	"github.com/bcc/eventops-be/docs"
	"github.com/bcc/eventops-be/internal/cache"
	"github.com/bcc/eventops-be/internal/config"
	apperr "github.com/bcc/eventops-be/internal/errors"
	"github.com/bcc/eventops-be/internal/handler"
	"github.com/bcc/eventops-be/internal/middleware"
	"github.com/bcc/eventops-be/internal/models"
	"github.com/bcc/eventops-be/internal/repository"
	"github.com/bcc/eventops-be/internal/response"
	"github.com/bcc/eventops-be/internal/service"
	"github.com/bcc/eventops-be/internal/ws"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"gorm.io/gorm"
)

var swaggerServers = []map[string]string{
	{"url": "/api/v1", "description": "Local Development Server"},
	{"url": "https://group4-be.bccdev.id/api/v1", "description": "Production Server"},
}

func serveSwaggerSpec(c *fiber.Ctx) error {
	raw := docs.SwaggerInfo.ReadDoc()

	var spec map[string]json.RawMessage
	if err := json.Unmarshal([]byte(raw), &spec); err != nil {
		return err
	}

	components := map[string]json.RawMessage{}

	if v, ok := spec["definitions"]; ok {
		components["schemas"] = rewriteRefs(v)
		delete(spec, "definitions")
	}

	if v, ok := spec["parameters"]; ok {
		components["parameters"] = rewriteRefs(v)
		delete(spec, "parameters")
	}

	if v, ok := spec["securityDefinitions"]; ok {
		components["securitySchemes"] = convertSecurityDefinitions(v)
		delete(spec, "securityDefinitions")
	}

	if paths, ok := spec["paths"]; ok {
		paths = rewriteRefs(paths)
		paths = convertBodyParams(paths)
		spec["paths"] = paths
	}

	spec["components"] = mustMarshal(components)
	spec["openapi"] = mustMarshal("3.0.3")
	spec["servers"] = mustMarshal(swaggerServers)
	delete(spec, "swagger")
	delete(spec, "host")
	delete(spec, "basePath")

	buf, err := json.Marshal(spec)
	if err != nil {
		return err
	}

	c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
	return c.Send(buf)
}

func convertResponses(v json.RawMessage) json.RawMessage {
	var responses map[string]map[string]json.RawMessage
	if err := json.Unmarshal(v, &responses); err != nil {
		return v
	}

	for code, resp := range responses {
		schema, ok := resp["schema"]
		if !ok {
			continue
		}

		resp["content"] = mustMarshal(map[string]json.RawMessage{
			"application/json": mustMarshal(map[string]json.RawMessage{"schema": schema}),
		})
		delete(resp, "schema")

		responses[code] = resp
	}

	return mustMarshal(responses)
}

func rewriteRefs(v json.RawMessage) json.RawMessage {
	s := string(v)
	s = strings.ReplaceAll(s, "#/definitions/", "#/components/schemas/")
	s = strings.ReplaceAll(s, "#/parameters/", "#/components/parameters/")
	return json.RawMessage(s)
}

func convertBodyParams(v json.RawMessage) json.RawMessage {
	var paths map[string]map[string]json.RawMessage
	if err := json.Unmarshal(v, &paths); err != nil {
		return v
	}

	for path, ops := range paths {
		for method, rawOp := range ops {
			var op map[string]json.RawMessage
			if err := json.Unmarshal(rawOp, &op); err != nil {
				continue
			}

			var params []map[string]json.RawMessage
			if rawParams, ok := op["parameters"]; ok {
				_ = json.Unmarshal(rawParams, &params)
			}

			var kept []map[string]json.RawMessage
			var bodyParam map[string]json.RawMessage
			for _, p := range params {
				var in string
				_ = json.Unmarshal(p["in"], &in)
				if in == "body" {
					bodyParam = p
					continue
				}
				if in == "formData" {
					continue
				}
				kept = append(kept, p)
			}

			if bodyParam != nil {
				schema := bodyParam["schema"]
				if schema == nil {
					schema = mustMarshal(map[string]string{"type": "object"})
				}

				var desc string
				_ = json.Unmarshal(bodyParam["description"], &desc)

				required := true
				if r, ok := bodyParam["required"]; ok {
					_ = json.Unmarshal(r, &required)
				}

				content := map[string]json.RawMessage{
					"application/json": mustMarshal(map[string]json.RawMessage{"schema": schema}),
				}

				body := map[string]json.RawMessage{
					"content":  mustMarshal(content),
					"required": mustMarshal(required),
				}
				if desc != "" {
					body["description"] = mustMarshal(desc)
				}
				op["requestBody"] = mustMarshal(body)
			}

			if len(kept) > 0 {
				op["parameters"] = mustMarshal(kept)
			} else {
				delete(op, "parameters")
			}

			delete(op, "consumes")
			delete(op, "produces")
			delete(op, "schemes")

			if rawResp, ok := op["responses"]; ok {
				op["responses"] = convertResponses(rawResp)
			}

			out, err := json.Marshal(op)
			if err != nil {
				continue
			}
			ops[method] = out
		}
		paths[path] = ops
	}

	return mustMarshal(paths)
}

func convertSecurityDefinitions(v json.RawMessage) json.RawMessage {
	var defs map[string]map[string]json.RawMessage
	if err := json.Unmarshal(v, &defs); err != nil {
		return v
	}

	out := map[string]map[string]json.RawMessage{}
	for name, def := range defs {
		var typ string
		_ = json.Unmarshal(def["type"], &typ)

		switch typ {
		case "apiKey":
			var in string
			_ = json.Unmarshal(def["in"], &in)
			out[name] = def
			if in == "header" {
				delete(def, "in")
				delete(def, "name")
				def["type"] = mustMarshal("http")
				def["scheme"] = mustMarshal("bearer")
			}
		case "basic":
			out[name] = map[string]json.RawMessage{
				"type":        mustMarshal("http"),
				"scheme":      mustMarshal("basic"),
				"description": def["description"],
			}
		default:
			out[name] = def
		}
	}

	return mustMarshal(out)
}

func mustMarshal(v any) json.RawMessage {
	buf, _ := json.Marshal(v)
	return buf
}

func Register(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok", "service": cfg.App.Name})
	})

	app.Get("/swagger/doc.json", serveSwaggerSpec)
	app.Get("/swagger/*", swagger.HandlerDefault)

	userRepo := repository.NewUserRepository(db)
	refreshTokenRepo := repository.NewRefreshTokenRepository(db)
	authService := service.NewAuthService(userRepo, refreshTokenRepo, cfg.JWT)
	authHandler := handler.NewAuthHandler(authService)

	realtimeHub := ws.NewHub()
	realtimeHandler := handler.NewRealtimeHandler(realtimeHub)

	redisClient, err := cache.NewClient(cfg.Redis)
	if err != nil {
		log.Printf("warning: gagal konek ke Redis, cache akan dilewati: %v", err)
	}
	eventCache := cache.NewEventCache(redisClient)

	eventRepo := repository.NewEventRepository(db)
	registrationRepo := repository.NewRegistrationRepository(db)
	committeeRepo := repository.NewCommitteeRepository(db)
	eventService := service.NewEventService(eventRepo, registrationRepo, eventCache)
	eventHandler := handler.NewEventHandler(eventService)

	registrationService := service.NewRegistrationService(registrationRepo, eventRepo, realtimeHub, eventCache)
	registrationHandler := handler.NewRegistrationHandler(registrationService)

	sessionRepo := repository.NewSessionRepository(db)
	dashboardService := service.NewDashboardService(eventRepo, registrationRepo, sessionRepo)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)

	sessionService := service.NewSessionService(sessionRepo, eventRepo, committeeRepo, realtimeHub)
	sessionHandler := handler.NewSessionHandler(sessionService)

	invitationRepo := repository.NewInvitationRepository(db)
	committeeService := service.NewCommitteeService(invitationRepo, committeeRepo, userRepo, realtimeHub)
	committeeHandler := handler.NewCommitteeHandler(committeeService)

	announcementRepo := repository.NewAnnouncementRepository(db)
	announcementService := service.NewAnnouncementService(announcementRepo, realtimeHub)
	announcementHandler := handler.NewAnnouncementHandler(announcementService)

	api := app.Group("/api/v1")
	api.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "BCC EventOps API v1",
		})
	})

	authMiddleware := middleware.RequireAuth(cfg)

	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", authMiddleware, authHandler.Me)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/logout", authHandler.Logout)

	requireCoordinator := middleware.RequireEventRole(committeeRepo, models.RoleCoordinator)
	requireCommittee := middleware.RequireEventRole(committeeRepo, models.RoleCoordinator, models.RoleCommittee)

	events := api.Group("/events", authMiddleware)
	events.Get("/", eventHandler.List)
	events.Post("/", eventHandler.Create)
	events.Get("/:eventId", eventHandler.Get)
	events.Patch("/:eventId", requireCoordinator, eventHandler.Update)
	events.Delete("/:eventId", requireCoordinator, eventHandler.Delete)

	registrations := events.Group("/:eventId/registrations")
	registrations.Post("/", registrationHandler.Register)
	registrations.Post("/me/cancel", registrationHandler.CancelSelf)
	registrations.Post("/:registrationId/cancel", requireCoordinator, registrationHandler.CancelByID)
	registrations.Post("/:registrationId/check-in", requireCommittee, registrationHandler.CheckIn)

	sessions := events.Group("/:eventId/sessions")
	sessions.Get("/", sessionHandler.List)
	sessions.Post("/", requireCoordinator, sessionHandler.Create)
	sessions.Patch("/:sessionId", requireCoordinator, sessionHandler.Update)
	sessions.Delete("/:sessionId", requireCoordinator, sessionHandler.Delete)
	sessions.Patch("/:sessionId/status", requireCommittee, sessionHandler.UpdateStatus)

	me := api.Group("/me", authMiddleware)
	me.Get("/registrations", registrationHandler.ListMine)
	me.Get("/invitations", committeeHandler.ListMyInvitations)

	events.Get("/:eventId/participants", requireCommittee, registrationHandler.ListParticipants)
	events.Get("/:eventId/dashboard", requireCommittee, dashboardHandler.Get)

	events.Post("/:eventId/invitations", requireCoordinator, committeeHandler.Invite)
	events.Delete("/:eventId/invitations/:invitationId", requireCoordinator, committeeHandler.CancelInvitation)
	events.Get("/:eventId/committees", requireCommittee, committeeHandler.GetOverview)
	events.Delete("/:eventId/committees/me", requireCommittee, committeeHandler.LeaveSelf)
	events.Patch("/:eventId/committees/:userId", requireCoordinator, committeeHandler.UpdateMemberRole)
	events.Delete("/:eventId/committees/:userId", requireCoordinator, committeeHandler.RemoveMember)

	invitations := api.Group("/invitations", authMiddleware)
	invitations.Post("/:invitationId/accept", committeeHandler.Accept)
	invitations.Post("/:invitationId/reject", committeeHandler.Reject)

	events.Get("/:eventId/announcements", announcementHandler.List)
	events.Post("/:eventId/announcements", requireCommittee, announcementHandler.Create)
	events.Patch("/:eventId/announcements/:announcementId", requireCommittee, announcementHandler.Update)
	events.Delete("/:eventId/announcements/:announcementId", requireCommittee, announcementHandler.Delete)

	wsAuth := middleware.RequireWSAuth(cfg)
	wsEvents := app.Group("/ws/v1/events/:eventId")
	wsEvents.Get("/public", middleware.RequireWSUpgrade, wsAuth, realtimeHandler.PublicRoom)
	wsEvents.Get("/committee", middleware.RequireWSUpgrade, wsAuth, requireCommittee, realtimeHandler.CommitteeRoom)
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	var appErr *apperr.AppError
	if errors.As(err, &appErr) {
		if appErr.Data != nil {
			return response.ErrorWithData(c, appErr.Status, appErr.Code, appErr.Message, appErr.Data)
		}
		return response.Error(c, appErr.Status, appErr.Code, appErr.Message)
	}

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		return response.Error(c, fiberErr.Code, "HTTP_ERROR", fiberErr.Message)
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return response.Error(c, fiber.StatusNotFound, "NOT_FOUND", "Data tidak ditemukan.")
	}

	log.Printf("unhandled error: %v", err)
	return response.Error(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Terjadi kesalahan pada server.")
}
