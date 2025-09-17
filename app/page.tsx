"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ThemeSelector } from "@/components/theme-selector"
import { useTheme } from "@/lib/theme-context"
import { motion } from "framer-motion"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [error, setError] = useState("")
  const { theme } = useTheme()
  const router = useRouter()

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!playerName.trim()) {
      setError("Player name is required")
      return
    }

    const params = new URLSearchParams({
      player: playerName.trim(),
      theme: theme,
    })
    router.push(`/game?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className={`text-5xl font-bold font-sans text-balance ${
              theme === "halloween" ? "halloween-glow" : theme === "galaxy" ? "galaxy-glow" : ""
            }`}
          >
            Rock Paper Scissors
          </h1>
          <p className="text-lg text-muted-foreground text-pretty">Challenge players worldwide in themed battles!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-xl text-center text-card-foreground">Choose Your Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card
            className={`bg-card/80 backdrop-blur-sm border-border ${
              theme === "halloween" ? "halloween-glow" : theme === "galaxy" ? "galaxy-glow" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="text-2xl text-center text-card-foreground">Join Battle</CardTitle>
              <CardDescription className="text-center">Enter your name to find an opponent</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartGame} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="player" className="text-card-foreground font-medium">
                    Your Battle Name
                  </Label>
                  <Input
                    id="player"
                    type="text"
                    placeholder="Enter your warrior name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-input border-border focus:ring-ring"
                    maxLength={20}
                  />
                </div>

                {error && (
                  <motion.div
                    className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className={`w-full font-semibold py-3 text-lg ${
                      theme === "halloween" ? "halloween-glow" : theme === "galaxy" ? "galaxy-glow" : ""
                    }`}
                  >
                    {theme === "halloween" ? "🎃 Enter Spooky Arena" : "🚀 Launch Into Battle"}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link href="/leaderboard">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                className="bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground border-border backdrop-blur-sm"
              >
                {theme === "halloween" ? "👻 Hall of Fame" : "⭐ Leaderboard"}
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="bg-muted/30 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg text-center text-foreground">
                {theme === "halloween" ? "🎃 Spooky Rules" : "🌌 Cosmic Rules"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <p>• {theme === "halloween" ? "🪨 Rock crushes Scissors" : "🪨 Asteroid crushes Laser"}</p>
                <p>• {theme === "halloween" ? "✂️ Scissors cuts Paper" : "⚡ Laser cuts Nebula"}</p>
                <p>• {theme === "halloween" ? "📄 Paper covers Rock" : "🌌 Nebula covers Asteroid"}</p>
                <p>• Same choice = Cosmic tie</p>
                <p>• Real-time multiplayer battles</p>
                <p>• Win matches to climb the leaderboard</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
