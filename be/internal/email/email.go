package email

import (
	"fmt"
	"log/slog"
	"net/smtp"

	"github.com/bcc/eventops-be/internal/config"
)

type Sender interface {
	Send(to, subject, body string) error
}

func NewSender(cfg config.SMTPConfig) Sender {
	if cfg.Host == "" {
		return &logSender{}
	}
	return &smtpSender{cfg: cfg}
}

type logSender struct{}

func (s *logSender) Send(to, subject, body string) error {
	slog.Info("email not sent (SMTP belum dikonfigurasi)",
		slog.String("to", to),
		slog.String("subject", subject),
		slog.String("body", body),
	)
	return nil
}

type smtpSender struct {
	cfg config.SMTPConfig
}

func (s *smtpSender) Send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%s", s.cfg.Host, s.cfg.Port)

	var auth smtp.Auth
	if s.cfg.User != "" {
		auth = smtp.PlainAuth("", s.cfg.User, s.cfg.Password, s.cfg.Host)
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s\r\n", s.cfg.From, to, subject, body)

	return smtp.SendMail(addr, auth, s.cfg.From, []string{to}, []byte(msg))
}
