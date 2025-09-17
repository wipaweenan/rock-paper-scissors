"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"
import { motion, AnimatePresence } from "framer-motion"
// @ts-ignore
import confetti from "canvas-confetti"
import { createClient } from "@/lib/supabase/client"

type Choice = "rock" | "paper" | "scissors" | null
type GameResult = "win" | "lose" | "draw" | null

const getChoices = (theme: string) => {
  if (theme === "halloween") {
    return [
      { value: "rock", label: "Rock", icon: "🎃" },
      { value: "paper", label: "Paper", icon: "👻" },
      { value: "scissors", label: "Scissors", icon: "🦇" },
    ] as const
  }
  return [
    { value: "rock", label: "Rock", icon: "🪨" },
    { value: "paper", label: "Paper", icon: "📄" },
    { value: "scissors", label: "Scissors", icon: "✂️" },
  ] as const
}

function GameContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [playerName, setPlayerName] = useState("")
  const [playerChoice, setPlayerChoice] = useState<Choice>(null)
  const [computerChoice, setComputerChoice] = useState<Choice>(null)
  const [gameResult, setGameResult] = useState<GameResult>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [gameStarted, setGameStarted] = useState(false)
  const [playerStats, setPlayerStats] = useState({ wins: 0, losses: 0, draws: 0 })

  const choices = getChoices(theme)
  const supabase = createClient()

  useEffect(() => {
    const player = searchParams.get("player")
    const selectedTheme = searchParams.get("theme")

    if (!player) {
      router.push("/")
      return
    }

    setPlayerName(player)
    setGameStarted(true)
    loadPlayerStats(player)
  }, [searchParams, router, theme])

  // Load player stats from database
  const loadPlayerStats = async (playerName: string) => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("player_name", playerName)
        .single()

      if (data && !error) {
        setPlayerStats({
          wins: data.wins || 0,
          losses: data.losses || 0,
          draws: data.draws || 0
        })
      } else {
        console.log("Player stats not found, starting fresh")
      }
    } catch (err) {
      console.log("Error loading player stats:", err)
      // Start with fresh stats if database is not available
      setPlayerStats({ wins: 0, losses: 0, draws: 0 })
    }
  }

  // Save game result to database
  const saveGameResult = async (playerName: string, result: GameResult, playerChoice: Choice, computerChoice: Choice) => {
    try {
      // Save individual game record
      const { error: gameError } = await supabase
        .from("games")
        .insert({
          player1_name: playerName,
          player2_name: "Computer",
          player1_choice: playerChoice,
          player2_choice: computerChoice,
          winner: result === "win" ? "player1" : result === "lose" ? "player2" : "tie",
          game_mode: "single_player"
        })

      if (gameError) {
        console.error("Error saving game record:", gameError)
      }

      // Update leaderboard
      const { data: existingStats, error: fetchError } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("player_name", playerName)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching existing stats:", fetchError)
        return
      }

      if (existingStats) {
        // Update existing stats
        const newStats = {
          wins: existingStats.wins + (result === "win" ? 1 : 0),
          losses: existingStats.losses + (result === "lose" ? 1 : 0),
          draws: existingStats.draws + (result === "draw" ? 1 : 0),
          updated_at: new Date().toISOString()
        }
        
        const { error: updateError } = await supabase
          .from("leaderboard")
          .update(newStats)
          .eq("player_name", playerName)

        if (updateError) {
          console.error("Error updating stats:", updateError)
        } else {
          setPlayerStats(newStats)
        }
      } else {
        // Create new player stats
        const newStats = {
          player_name: playerName,
          wins: result === "win" ? 1 : 0,
          losses: result === "lose" ? 1 : 0,
          draws: result === "draw" ? 1 : 0,
          updated_at: new Date().toISOString()
        }
        
        const { error: insertError } = await supabase
          .from("leaderboard")
          .insert(newStats)

        if (insertError) {
          console.error("Error inserting new stats:", insertError)
        } else {
          setPlayerStats(newStats)
        }
      }
    } catch (err) {
      console.error("Error saving game result:", err)
      // Update local stats even if database fails
      setPlayerStats(prev => ({
        wins: prev.wins + (result === "win" ? 1 : 0),
        losses: prev.losses + (result === "lose" ? 1 : 0),
        draws: prev.draws + (result === "draw" ? 1 : 0)
      }))
    }
  }

  // Computer AI - random choice
  const getComputerChoice = (): Choice => {
    const choices: Choice[] = ["rock", "paper", "scissors"]
    return choices[Math.floor(Math.random() * choices.length)]
  }

  // Determine game result
  const determineResult = (player: Choice, computer: Choice): GameResult => {
    if (player === computer) return "draw"
    
    const winConditions = {
      rock: "scissors",
      paper: "rock", 
      scissors: "paper"
    }
    
    return winConditions[player as keyof typeof winConditions] === computer ? "win" : "lose"
  }

  // Handle player choice
  const handlePlayerChoice = (choice: Choice) => {
    if (isLoading) return
    
    setIsLoading(true)
    setPlayerChoice(choice)
    
    // Computer makes choice after a short delay
    setTimeout(async () => {
      const computer = getComputerChoice()
      setComputerChoice(computer)
      
      const result = determineResult(choice, computer)
      setGameResult(result)
      
      // Save game result to database
      await saveGameResult(playerName, result, choice, computer)
      
      // Show confetti for win
      if (result === "win") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
      
      setIsLoading(false)
    }, 1000)
  }

  // Reset game
  const resetGame = () => {
    setPlayerChoice(null)
    setComputerChoice(null)
    setGameResult(null)
    setIsLoading(false)
  }

  // Helper function to get choice label
  const getChoiceLabel = (choice: Choice) => {
    if (!choice) return ""
    const choiceObj = choices.find(c => c.value === choice)
    return choiceObj ? choiceObj.label : choice
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading game...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {theme === "halloween" ? "🎃 Spooky Battle" : "🚀 Space Duel"}
          </h1>
          <p className="text-muted-foreground">
            {theme === "halloween" 
              ? `Welcome, ${playerName}! Choose your weapon to battle the computer!`
              : `Welcome, ${playerName}! Choose your weapon for the space battle!`
            }
          </p>
          
          {/* Player Stats */}
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="bg-green-500/20 text-green-600 px-3 py-1 rounded-full">
              🏆 Wins: {playerStats.wins}
            </div>
            <div className="bg-red-500/20 text-red-600 px-3 py-1 rounded-full">
              💀 Losses: {playerStats.losses}
            </div>
            <div className="bg-yellow-500/20 text-yellow-600 px-3 py-1 rounded-full">
              🤝 Draws: {playerStats.draws}
            </div>
          </div>
        </div>

        {/* Game Status */}
        <AnimatePresence mode="wait">
          {!playerChoice && !gameResult && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-center">
                    {theme === "halloween" ? "👻 Choose Your Weapon" : "⭐ Choose Your Weapon"}
                  </CardTitle>
                  <CardDescription className="text-center">
                    {theme === "halloween" 
                      ? "Select your spooky weapon to battle the computer!"
                      : "Select your space weapon to battle the computer!"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {choices.map((choice) => (
                      <motion.div
                        key={choice.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => handlePlayerChoice(choice.value)}
                          disabled={isLoading}
                          className="w-full h-24 text-lg flex flex-col items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border-2 border-primary/20 hover:border-primary/40"
                        >
                          <span className="text-2xl">{choice.icon}</span>
                          <span className="text-orange-500">{choice.label}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {playerChoice && !gameResult && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-center">
                    {theme === "halloween" ? "👻 Computer is thinking..." : "🤖 Computer is thinking..."}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex justify-center items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {choices.find(c => c.value === playerChoice)?.icon}
                      </div>
                      <p className="font-semibold">{playerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getChoiceLabel(playerChoice)}
                      </p>
                    </div>
                    <div className="text-2xl">VS</div>
                    <div className="text-center">
                      <div className="text-4xl mb-2 animate-spin">🤖</div>
                      <p className="font-semibold">Computer</p>
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {gameResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-center">
                    {gameResult === "win" && (theme === "halloween" ? "🎃 You Win!" : "🚀 Victory!")}
                    {gameResult === "lose" && (theme === "halloween" ? "👻 You Lose!" : "💥 Defeat!")}
                    {gameResult === "draw" && (theme === "halloween" ? "🦇 It's a Draw!" : "⭐ It's a Tie!")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="flex justify-center items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {choices.find(c => c.value === playerChoice)?.icon}
                      </div>
                      <p className="font-semibold">{playerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getChoiceLabel(playerChoice)}
                      </p>
                    </div>
                    <div className="text-2xl">VS</div>
                    <div className="text-center">
                      <div className="text-4xl mb-2">
                        {choices.find(c => c.value === computerChoice)?.icon}
                      </div>
                      <p className="font-semibold">Computer</p>
                      <p className="text-sm text-muted-foreground">
                        {getChoiceLabel(computerChoice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={resetGame} className="bg-primary hover:bg-primary/90">
                        {theme === "halloween" ? "Play Again" : "Play Again"}
                      </Button>
                    </motion.div>
                    <Link href="/leaderboard">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" className="border-border bg-transparent">
                          {theme === "halloween" ? "Leaderboard" : "Leaderboard"}
                        </Button>
                      </motion.div>
                    </Link>
                    <Link href="/">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" className="border-border bg-transparent">
                          {theme === "halloween" ? " Home" : "Home"}
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-destructive">{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  )
}