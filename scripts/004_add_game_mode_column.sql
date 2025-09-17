-- Add game_mode column to games table to track human vs computer games
ALTER TABLE games ADD COLUMN game_mode VARCHAR(10) DEFAULT 'human';

-- Add index for game mode queries
CREATE INDEX idx_games_mode ON games(game_mode);

-- Update existing records to have 'human' mode
UPDATE games SET game_mode = 'human' WHERE game_mode IS NULL;
