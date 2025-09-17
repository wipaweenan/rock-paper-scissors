-- Create a view for leaderboard statistics
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  player_name,
  COUNT(*) as total_games,
  SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
  SUM(CASE WHEN result = 'tie' THEN 1 ELSE 0 END) as ties,
  ROUND(
    (SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
    1
  ) as win_percentage
FROM (
  -- Player 1 results
  SELECT 
    player1_name as player_name,
    CASE 
      WHEN winner = 'player1' THEN 'win'
      WHEN winner = 'player2' THEN 'loss'
      ELSE 'tie'
    END as result
  FROM games
  
  UNION ALL
  
  -- Player 2 results
  SELECT 
    player2_name as player_name,
    CASE 
      WHEN winner = 'player2' THEN 'win'
      WHEN winner = 'player1' THEN 'loss'
      ELSE 'tie'
    END as result
  FROM games
) player_results
GROUP BY player_name
ORDER BY wins DESC, win_percentage DESC;
