import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Number.parseInt(searchParams.get("limit") || "50")

    // Get leaderboard data with player names
    const { data, error } = await supabase
      .from("leaderboard")
      .select(`
        *,
        players (name)
      `)
      .order("wins", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedData =
      data?.map((entry) => ({
        player_id: entry.player_id,
        player_name: entry.players.name,
        wins: entry.wins,
        losses: entry.losses,
        draws: entry.draws,
        total_games: entry.wins + entry.losses + entry.draws,
        win_percentage:
          entry.wins + entry.losses + entry.draws > 0
            ? Math.round((entry.wins / (entry.wins + entry.losses + entry.draws)) * 100)
            : 0,
        updated_at: entry.updated_at,
      })) || []

    return NextResponse.json({ leaderboard: transformedData })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
