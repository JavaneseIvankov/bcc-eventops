package utils

import (
	"fmt"
	"math/rand/v2"
	"strings"
	"time"
)

func GenerateQRToken() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

	var b strings.Builder
	for i := 0; i < 12; i++ {
		b.WriteByte(charset[rand.IntN(len(charset))])
	}

	suffix := make([]byte, 3)
	for i := range suffix {
		suffix[i] = charset[rand.IntN(len(charset))]
	}

	return fmt.Sprintf("EVT-%s-%s", b.String(), string(suffix))
}

func NowUTC() time.Time { return time.Now().UTC() }
