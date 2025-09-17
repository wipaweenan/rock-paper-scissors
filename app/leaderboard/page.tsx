"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface LeaderboardEntry {
  id: string
  player_name: string
  wins: number
  losses: number
  draws: number
  total_games: number
  win_percentage: number
}

interface RecentMatch {
  id: string
  theme: string
  created_at: string
  player1_name: string
  player2_name: string
  player1_choice: string
  player2_choice: string
  player1_result: string
  player2_result: string
}

export default function LeaderboardPage() {
  const { theme } = useTheme()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    loadLeaderboardData()
  }, [])

  const loadLeaderboardData = async () => {
    try {
      setIsLoading(true)

      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from("leaderboard")
        .select("*")
        .order("wins", { ascending: false })
        .limit(50)

      if (leaderboardError) throw leaderboardError

      // Transform data for display
      const transformedLeaderboard = leaderboardData.map((entry) => ({
        id: entry.id,
        player_name: entry.player_name,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        total_games: entry.wins + entry.losses + entry.draws,
        win_percentage:
          entry.wins + entry.losses + entry.draws > 0
            ? Math.round((entry.wins / (entry.wins + entry.losses + entry.draws)) * 100)
            : 0,
      }))

      setLeaderboard(transformedLeaderboard)

      const { data: gamesData, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (gamesError) throw gamesError

      // Transform games data
      const transformedMatches = gamesData.map((game) => ({
        id: game.id,
        theme: "single_player", // Default theme for single player games
        created_at: game.created_at,
        player1_name: game.player1_name,
        player2_name: game.player2_name,
        player1_choice: game.player1_choice,
        player2_choice: game.player2_choice,
        player1_result: game.winner === "player1" ? "win" : game.winner === "player2" ? "lose" : "draw",
        player2_result: game.winner === "player2" ? "win" : game.winner === "player1" ? "lose" : "draw",
      }))

      setRecentMatches(transformedMatches)
    } catch (err) {
      console.error("Error loading leaderboard:", err)
      setError("Failed to load leaderboard data. Make sure to run the SQL script first.")
      // Set empty data to prevent crashes
      setLeaderboard([])
      setRecentMatches([])
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return theme === "halloween" ? "🎃" : "🌟"
      case 2:
        return theme === "halloween" ? "👻" : "⭐"
      case 3:
        return theme === "halloween" ? "🦇" : "💫"
      default:
        return `#${rank}`
    }
  }

  const getChoiceIcon = (choice: string, matchTheme: string) => {
    if (matchTheme === "halloween") {
      switch (choice) {
        case "rock":
          return "🎃"
        case "paper":
          return "👻"
        case "scissors":
          return "🦇"
        default:
          return "❓"
      }
    } else if (matchTheme === "galaxy") {
      switch (choice) {
        case "rock":
          return "🪨"
        case "paper":
          return "🌌"
        case "scissors":
          return "⚡"
        default:
          return "❓"
      }
    }
    return choice === "rock" ? "🪨" : choice === "paper" ? "📄" : choice === "scissors" ? "✂️" : "❓"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <div className="text-4xl">{theme === "halloween" ? "🎃" : "🌌"}</div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={`text-4xl font-bold font-sans ${theme === "halloween" ? "halloween-glow" : "galaxy-glow"}`}>
            {theme === "halloween" ? "👻 Hall of Fame" : "⭐ Galactic Leaderboard"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {theme === "halloween" ? "See who rules the spooky arena!" : "Champions of the cosmic battlefield!"}
          </p>
        </motion.div>
        {leaderboard.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="bg-muted/30 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-lg text-center text-foreground">
                  {theme === "halloween" ? "🎃 Spooky Statistics" : "🌌 Cosmic Statistics"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {leaderboard.reduce((sum, player) => sum + player.total_games, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Battles</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{leaderboard.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === "halloween" ? "Spooky Warriors" : "Cosmic Fighters"}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">
                      {leaderboard.reduce((sum, player) => sum + player.wins, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Victories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {leaderboard.reduce((sum, player) => sum + player.draws, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Cosmic Ties</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        <motion.div
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className={`${theme === "halloween" ? "halloween-glow" : "galaxy-glow"}`}>
                {theme === "halloween" ? "New Battle" : "New Mission"}
              </Button>
            </motion.div>
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" className="border-border bg-transparent" onClick={() => loadLeaderboardData()}>
              {theme === "halloween" ? "Refresh" : "Refresh"}
            </Button>
          </motion.div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            
            <Card
              className={`bg-card/80 backdrop-blur-sm border-border ${
                theme === "halloween" ? "halloween-glow" : "galaxy-glow"
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl text-card-foreground">
                  {theme === "halloween" ? "🏆Top Spooky Warriors" : "🏆Elite Cosmic Fighters"}
                </CardTitle>
                <CardDescription>Ranked by victories and win percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md mb-4">{error}</div>}

                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">{theme === "halloween" ? "🎃" : "🌌"}</div>
                    <p className="text-muted-foreground text-lg">No battles fought yet!</p>
                    <p className="text-muted-foreground">Be the first legendary warrior</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaderboard.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                          index < 3
                            ? `bg-secondary/20 border-secondary ${theme === "halloween" ? "halloween-glow" : "galaxy-glow"}`
                            : "bg-muted/30 border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold min-w-[3rem] text-center">{getRankIcon(index + 1)}</div>
                          <div>
                            <h3 className="font-semibold text-lg text-card-foreground">{player.player_name}</h3>
                            <p className="text-sm text-muted-foreground">{player.total_games} battles fought</p>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              {player.wins}W
                            </Badge>
                            <Badge variant="outline" className="border-muted-foreground/30">
                              {player.losses}L
                            </Badge>
                            <Badge variant="outline" className="border-muted-foreground/30">
                              {player.draws}D
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-card-foreground">
                            {player.win_percentage}% victory rate
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/80 backdrop-blur-sm border-border">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">
                  {theme === "halloween" ? "🦇 Recent Battles" : "🌠 Recent Duels"}
                </CardTitle>
                <CardDescription>Latest cosmic encounters</CardDescription>
              </CardHeader>
              <CardContent>
                {recentMatches.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">{theme === "halloween" ? "👻" : "🌌"}</div>
                    <p className="text-muted-foreground">No recent battles</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMatches.map((match, index) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-3 rounded-lg border space-y-2 ${
                          match.theme === "halloween"
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-purple-500/10 border-purple-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-card-foreground">
                            {match.player1_name} vs {match.player2_name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {match.theme === "halloween" ? "🎃" : "🌌"}
                            </Badge>
                            <span className="text-muted-foreground text-xs">{formatDate(match.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center space-x-4 text-lg">
                          <div className="text-center">
                            <div>{getChoiceIcon(match.player1_choice, match.theme)}</div>
                            <div className="text-xs text-muted-foreground mt-1">{match.player1_name}</div>
                          </div>

                          <div className="text-muted-foreground font-bold">VS</div>

                          <div className="text-center">
                            <div>{getChoiceIcon(match.player2_choice, match.theme)}</div>
                            <div className="text-xs text-muted-foreground mt-1">{match.player2_name}</div>
                          </div>
                        </div>

                        <div className="text-center text-sm">
                          {match.player1_result === "draw" ? (
                            <Badge variant="outline" className="border-muted-foreground/30">
                              Cosmic Tie
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              {match.player1_result === "win" ? match.player1_name : match.player2_name} victorious!
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        

       
      </div>
    </div>
  )
}
