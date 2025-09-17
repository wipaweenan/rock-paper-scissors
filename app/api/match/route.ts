import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { action, player_name, theme, match_id } = body

    // Validate required fields
    if (!action || !player_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action === "create") {
      // Create new match
      if (!theme) {
        return NextResponse.json({ error: "Theme is required for creating match" }, { status: 400 })
      }

      // First, create or get player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .upsert({ name: player_name.trim() }, { onConflict: "name" })
        .select()
        .single()

      if (playerError) {
        console.error("Player creation error:", playerError)
        return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
      }

      // Create new match
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert({ theme, status: "waiting" })
        .select()
        .single()

      if (matchError) {
        console.error("Match creation error:", matchError)
        return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
      }

      // Add player to match
      const { error: joinError } = await supabase
        .from("match_players")
        .upsert({ match_id: matchData.id, player_id: playerData.id }, { onConflict: "match_id,player_id" })

      if (joinError) {
        console.error("Join match error:", joinError)
        return NextResponse.json({ error: "Failed to join match" }, { status: 500 })
      }

      return NextResponse.json(
        {
          success: true,
          match: matchData,
          player: playerData,
        },
        { status: 201 },
      )
    } else if (action === "join") {
      // Join existing match
      if (!match_id) {
        return NextResponse.json({ error: "Match ID is required for joining" }, { status: 400 })
      }

      // Get or create player
      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .upsert({ name: player_name.trim() }, { onConflict: "name" })
        .select()
        .single()

      if (playerError) {
        console.error("Player creation error:", playerError)
        return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
      }

      // Check if match exists and is waiting
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", match_id)
        .eq("status", "waiting")
        .single()

      if (matchError || !matchData) {
        return NextResponse.json({ error: "Match not found or not available" }, { status: 404 })
      }

      // Add player to match
      const { error: joinError } = await supabase
        .from("match_players")
        .upsert({ match_id: match_id, player_id: playerData.id }, { onConflict: "match_id,player_id" })

      if (joinError) {
        console.error("Join match error:", joinError)
        return NextResponse.json({ error: "Failed to join match" }, { status: 500 })
      }

      // Update match status to in_progress
      const { error: updateError } = await supabase.from("matches").update({ status: "in_progress" }).eq("id", match_id)

      if (updateError) {
        console.error("Match update error:", updateError)
        return NextResponse.json({ error: "Failed to update match status" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        match: matchData,
        player: playerData,
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get match information
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const match_id = searchParams.get("match_id")
    const theme = searchParams.get("theme")

    if (match_id) {
      // Get specific match with players
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(`
          *,
          match_players (
            *,
            players (name)
          )
        `)
        .eq("id", match_id)
        .single()

      if (matchError) {
        console.error("Match fetch error:", matchError)
        return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 })
      }

      return NextResponse.json({ match: matchData })
    } else if (theme) {
      // Find waiting match with specific theme
      const { data: waitingMatch, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "waiting")
        .eq("theme", theme)
        .limit(1)
        .single()

      if (matchError && matchError.code !== "PGRST116") {
        console.error("Match search error:", matchError)
        return NextResponse.json({ error: "Failed to search for matches" }, { status: 500 })
      }

      return NextResponse.json({ match: waitingMatch || null })
    } else {
      return NextResponse.json({ error: "Match ID or theme is required" }, { status: 400 })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
