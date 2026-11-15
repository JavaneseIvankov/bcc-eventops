CREATE TABLE IF NOT EXISTS session_bookmarks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_session_bookmarks_user_session UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_bookmarks_user ON session_bookmarks (user_id);
