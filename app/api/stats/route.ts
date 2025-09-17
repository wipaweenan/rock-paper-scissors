import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const player = searchParams.get("player")

    if (player) {
      // Get stats for a specific player
      const { data: playerStats, error: playerError } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("player_name", player)
        .single()

      if (playerError && playerError.code !== "PGRST116") {
        console.error("Database error:", playerError)
        return NextResponse.json({ error: "Failed to fetch player stats" }, { status: 500 })
      }

      // Get recent games for the player
      const { data: recentGames, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .or(`player1_name.eq.${player},player2_name.eq.${player}`)
        .order("created_at", { ascending: false })
        .limit(5)

      if (gamesError) {
        console.error("Database error:", gamesError)
        return NextResponse.json({ error: "Failed to fetch recent games" }, { status: 500 })
      }

      return NextResponse.json({
        player_stats: playerStats || null,
        recent_games: recentGames || [],
      })
    } else {
      // Get overall game statistics
      const { data: totalGames, error: totalError } = await supabase.from("games").select("id", { count: "exact" })

      const { data: totalPlayers, error: playersError } = await supabase
        .from("leaderboard")
        .select("player_name", { count: "exact" })

      if (totalError || playersError) {
        console.error("Database error:", totalError || playersError)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
      }

      // Get choice distribution
      const { data: choiceStats, error: choiceError } = await supabase.rpc("get_choice_distribution")

      const stats = {
        total_games: totalGames?.length || 0,
        total_players: totalPlayers?.length || 0,
        choice_distribution: choiceStats || [],
      }

      return NextResponse.json({ stats })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
