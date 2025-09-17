-- Fix database schema issues for multiplayer functionality
-- This addresses the constraint and table issues causing matchmaking errors

-- First, ensure we have the correct unique constraints
ALTER TABLE leaderboard DROP CONSTRAINT IF EXISTS leaderboard_player_id_key;
ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_player_id_unique UNIQUE (player_id);

-- Add missing unique constraint for players name to prevent duplicates
ALTER TABLE players ADD CONSTRAINT players_name_unique UNIQUE (name);

-- Fix the leaderboard update function to handle conflicts properly
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
      wins = leaderboard.wins + (CASE WHEN EXCLUDED.wins > 0 THEN 1 ELSE 0 END),
      losses = leaderboard.losses + (CASE WHEN EXCLUDED.losses > 0 THEN 1 ELSE 0 END),
      draws = leaderboard.draws + (CASE WHEN EXCLUDED.draws > 0 THEN 1 ELSE 0 END),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function for safe player creation
CREATE OR REPLACE FUNCTION create_or_get_player(player_name VARCHAR(50))
RETURNS UUID AS $$
DECLARE
  player_uuid UUID;
BEGIN
  -- Try to get existing player
  SELECT id INTO player_uuid FROM players WHERE name = player_name;
  
  -- If not found, create new player
  IF player_uuid IS NULL THEN
    INSERT INTO players (name) VALUES (player_name) RETURNING id INTO player_uuid;
  END IF;
  
  RETURN player_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data for testing
INSERT INTO players (name) VALUES ('Player 1'), ('Player 2') ON CONFLICT (name) DO NOTHING;
