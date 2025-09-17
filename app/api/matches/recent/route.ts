import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Get recent completed matches with player data
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id,
        theme,
        created_at,
        completed_at,
        match_players (
          move,
          result,
          players (name)
        )
      `)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch recent matches" }, { status: 500 })
    }

    // Transform data for frontend
    const transformedMatches =
      data
        ?.filter((match) => match.match_players.length === 2)
        .map((match) => {
          const [player1, player2] = match.match_players
          return {
            id: match.id,
            theme: match.theme,
            created_at: match.created_at,
            completed_at: match.completed_at,
            player1_name: player1.players.name,
            player2_name: player2.players.name,
            player1_choice: player1.move,
            player2_choice: player2.move,
            player1_result: player1.result,
            player2_result: player2.result,
          }
        }) || []

    return NextResponse.json({ matches: transformedMatches })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
