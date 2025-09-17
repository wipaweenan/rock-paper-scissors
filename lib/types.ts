export interface Game {
  id: string
  player1_name: string
  player2_name: string
  player1_choice: "rock" | "paper" | "scissors"
  player2_choice: "rock" | "paper" | "scissors"
  winner: "player1" | "player2" | "tie" | null
  created_at: string
}

export interface LeaderboardEntry {
  player_name: string
  total_games: number
  wins: number
  losses: number
  ties: number
  win_percentage: number
}

export interface GameStats {
  total_games: number
  total_players: number
  choice_distribution: {
    choice: string
    count: number
    percentage: number
  }[]
}

export interface PlayerStats {
  player_stats: LeaderboardEntry | null
  recent_games: Game[]
}
