CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  config_version INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
