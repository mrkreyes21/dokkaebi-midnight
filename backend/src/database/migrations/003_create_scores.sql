CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id UUID UNIQUE NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  score INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_player ON scores(player_id);
