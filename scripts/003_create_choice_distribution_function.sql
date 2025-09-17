-- Create a function to get choice distribution statistics
CREATE OR REPLACE FUNCTION get_choice_distribution()
RETURNS TABLE(choice TEXT, count BIGINT, percentage NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH choice_counts AS (
    SELECT 
      unnest(ARRAY[player1_choice, player2_choice]) as choice_name,
      COUNT(*) as total_choices
    FROM games
    GROUP BY choice_name
  ),
  total_count AS (
    SELECT SUM(total_choices) as total FROM choice_counts
  )
  SELECT 
    cc.choice_name::TEXT,
    cc.total_choices,
    ROUND((cc.total_choices::NUMERIC / tc.total * 100), 1) as percentage
  FROM choice_counts cc
  CROSS JOIN total_count tc
  ORDER BY cc.total_choices DESC;
END;
$$ LANGUAGE plpgsql;
