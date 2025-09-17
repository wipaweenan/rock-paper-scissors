-- Creating new multiplayer database schema with themes support
-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS games CASCADE;
DROP VIEW IF EXISTS leaderboard CASCADE;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table for multiplayer games
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  theme VARCHAR(20) DEFAULT 'halloween' CHECK (theme IN ('halloween', 'galaxy')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Match players table to track player participation and moves
CREATE TABLE IF NOT EXISTS match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  move VARCHAR(10) CHECK (move IN ('rock', 'paper', 'scissors')),
  result VARCHAR(10) CHECK (result IN ('win', 'lose', 'draw')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- Leaderboard table for persistent stats
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_theme ON matches(theme);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_wins ON leaderboard(wins DESC);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all operations on match_players" ON match_players FOR ALL USING (true);
CREATE POLICY "Allow all operations on leaderboard" ON leaderboard FOR ALL USING (true);

-- Function to update leaderboard after match completion
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Update leaderboard for both players when match is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update stats for all players in this match
    INSERT INTO leaderboard (player_id, wins, losses, draws)
    SELECT 
      mp.player_id,
      CASE WHEN mp.result = 'win' THEN 1 ELSE 0 END,
      CASE WHEN mp.result = 'lose' THEN 1 ELSE 0 END,
      CASE WHEN mp.result = 'draw' THEN 1 ELSE 0 END
    FROM match_players mp
    WHERE mp.match_id = NEW.id
    ON CONFLICT (player_id) DO UPDATE SET
      wins = leaderboard.wins + CASE WHEN EXCLUDED.wins > 0 THEN 1 ELSE 0 END,
      losses = leaderboard.losses + CASE WHEN EXCLUDED.losses > 0 THEN 1 ELSE 0 END,
      draws = leaderboard.draws + CASE WHEN EXCLUDED.draws > 0 THEN 1 ELSE 0 END,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when match is completed
CREATE TRIGGER update_leaderboard_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();
