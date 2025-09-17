-- Create games table to store game results
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player1_choice TEXT NOT NULL CHECK (player1_choice IN ('rock', 'paper', 'scissors')),
  player2_choice TEXT NOT NULL CHECK (player2_choice IN ('rock', 'paper', 'scissors')),
  winner TEXT CHECK (winner IN ('player1', 'player2', 'tie')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries on created_at for leaderboard
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
