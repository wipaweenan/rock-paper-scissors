-- Drop existing tables to recreate with correct structure
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;

-- Create games table for single player mode
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_name VARCHAR(50) NOT NULL,
  player2_name VARCHAR(50) NOT NULL DEFAULT 'Computer',
  player1_choice VARCHAR(10) CHECK (player1_choice IN ('rock', 'paper', 'scissors')),
  player2_choice VARCHAR(10) CHECK (player2_choice IN ('rock', 'paper', 'scissors')),
  winner VARCHAR(10) CHECK (winner IN ('player1', 'player2', 'tie')),
  game_mode VARCHAR(20) DEFAULT 'single_player' CHECK (game_mode IN ('single_player', 'multiplayer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table for single player mode
CREATE TABLE leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(50) UNIQUE NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all operations for now)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on leaderboard" ON leaderboard FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_games_player1_name ON games(player1_name);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_leaderboard_player_name ON leaderboard(player_name);
CREATE INDEX idx_leaderboard_wins ON leaderboard(wins DESC);

-- Insert some sample data for testing
INSERT INTO leaderboard (player_name, wins, losses, draws) VALUES 
('test', 0, 0, 0),
('demo', 5, 3, 2)
ON CONFLICT (player_name) DO NOTHING;
